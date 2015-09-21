"use strict";

/*
** This is the reception server for Pheromon.
** This code handle
**      -TCP connection with sensors
**      -sensor's network monitoring (2G, EDGE, 3G ...)
**      -data reception, decoding, saving and forwarding to app/admin server
*/


require('es6-shim');
var net = require('net');
var EventEmitter = require('events').EventEmitter;
var mosca = require('mosca');
var mqtt    = require('mqtt');
var pokemon = require("pokemon-names");
var mqttServer = require("./mqttServer.js");
var makeTcpReceiver = require('../tools/makeTcpReceiver');
var database = require('../database');
var utils = require('./utils.js');
var PRIVATE = require('../PRIVATE.json');
var CONF = require('../CONF.json');
// var simulateSensorStatusArrivalTCP = require('./simulateSensorStatusArrivalTCP');

var id2sensor = {};
var eventEmitter = new EventEmitter();

var DEBUG = process.env.NODE_ENV === "development" ? true : false;

var debug = function() {
    if (DEBUG) {
        [].unshift.call(arguments, "[DEBUG Pheromon] ");
        console.log.apply(console, arguments);
    }
}

// ############### Sensors communication ######################
var authenticate = function(client, username, token, callback) {
    var authorized = (token.toString() === PRIVATE.token);
    if (authorized) {

        // check if sensor exists in db
        database.Sensors.get(client.id)
        .then(function(sensor) {
            // if sensor was never registered, create it
            if(!sensor) {
                console.log("Creating the sensor")
                return database.Sensors.create({
                    'name': pokemon.random(),
                    'sim': client.id,
                    'period': CONF.period,
                    'start_hour': CONF.start_hour,
                    'stop_hour': CONF.stop_hour
                })
                .then(function(createdSensor){
                    return createdSensor;
                })
                .catch(function(err) {
                    console.log("[ERROR] Couldn't create sensor :", err);
                })
            }
            else { 
                return sensor;
            }
            
        })
        .then(function(sensor){
            id2sensor[client.id] = sensor;
        })
        .catch(function(err) {
            console.log("[ERROR] Couldn't get sensor's config in DB :", err);
        })
    }

    callback(null, authorized);
}

mqttServer(authenticate)
.then(function(mqttServer){

    // maestro: mqtt client that represents the server
    // maestro doesn't subscribe to anything since the server tells him everything
    var maestro  = mqtt.connect('mqtt://localhost:1883',
        {
            username: "maestro",
            password: PRIVATE.token,
            clientId: "maestro"
        }
    );

    maestro.on('connect', function () {
        console.log("Maestro ready")
    });



    mqttServer.on('published', function(packet, client) {
        console.log("MQTT ", packet.topic, packet.payload.toString())
        var subtopics = packet.topic.split("/");
        var id;
        if(id2sensor[subtopics[0]]) {
            id = subtopics[0];
            subtopics.shift();
        }
        switch(subtopics[0]) {
            case "command":
                switch (subtopics[1]) {
                    case 'starthour' :
                        var data = packet.payload.toString();
                        database.Sensors.update(id, {start_hour: parseInt(data)})
                        .then(function() {
                            console.log("start_hour updated");
                        })
                        .catch(function(err) {
                            console.log('error : cannot store start_hour in DB :', err)
                        })
                        break;
                    case 'stophour' :
                        var data = packet.payload.toString();
                        database.Sensors.update(id, {stop_hour: parseInt(data)})
                        .then(function() {
                            console.log("stop_hour updated");
                        })
                        .catch(function(err) {
                            console.log('error : cannot store stop_hour in DB :', err)
                        })
                        break;
                    case 'period' :
                        var data = packet.payload.toString();
                        database.Sensors.update(id, {period: parseInt(data)})
                        .then(function() {
                            console.log("period updated");
                        })
                        .catch(function(err) {
                            console.log('error : cannot store period in DB :', err)
                        })
                        break;
                    default:
                        console.log("Unknown command ", subtopics[1]);
                }
          
                break;
            case "status":
                console.log("received a status");
                switch (subtopics[1]) {
                    case "unitialized":
                        var date = new Date();
                        var sensor = id2sensor[id];
                        var data = [sensor.period, sensor.start_hour, sensor.stop_hour, date.toISOString()].join(" ");
                        maestro.publish(id + "/command/init", data);
                        break;
                }
                break;
            case "measurement":
                console.log("received a measurement");
                break;
            case 'network':
                var signal = packet.payload.toString();
                database.Sensors.update(id, {signal: signal})
                .then(function() {
                    console.log("network updated");
                })
                .catch(function(err) {
                    console.log('error : cannot store signal in DB :', err)
                })
                break;
            // default:
                // console.log("Received a message of an untreated topic.")
        }        

    });

});






//     database.Sensors.update(data.sensor.id, (msgStatus.info.command !== 'null') ?
//         { // If status + command result
//             latest_input: msgStatus.info.command,
//             latest_output: msgStatus.info.result,
//             quipu_status: msgStatus.quipu.state,
//             sense_status: msgStatus.sense
//         } : 
//         { // If only status
//             quipu_status: msgStatus.quipu.state,
//             sense_status: msgStatus.sense
//         })
//     .then(function(){
//         debug('id', data.sensor.id);
//         debug('Storage Success');
//         return {
//             sensorId: data.sensor.id,
//             socketMessage: msgStatus
//         };
//     })
//     .then(function(result) { // Send data to admin
//         eventEmitter.emit('data', {type: 'status', data: result});
//     })
//     .catch(function(err){
//         console.log("Storage FAILURE: ", err);
//     });
//     break;

// case 'data':
//     var msgDatas = JSON.parse(data.message.decoded);
//     Promise.all(msgDatas.map(function(msgData){
//         var messageContent = {
//             'sensor_id': data.sensor.id,
//             'type': 'wifi', // hardcoded for now
//             'measurements': msgData.signal_strengths,
//             'measurement_date': msgData.date
//         };
//         var socketMessage = Object.assign({}, messageContent);
//         socketMessage['installed_at'] = data.sensor.installed_at;

//         // persist message in database
//         if (msgData.date) {
//             return database.SensorMeasurements.create(messageContent)
//             .then(function(id) {
//                 return {
//                     sensorMeasurementId: id,
//                     measurement: socketMessage
//                 }
//             })
//             .catch(function(error){
//                 console.log("Storage FAILURE: ", error);
//             });
//         }
//     }))
//     .then(function(results) { // Send data to app
//         debug('Storage SUCCESS');
//         eventEmitter.emit('data', {type: 'data', data: results});
//     })
//     .catch(function(err) {
//         console.log("Storage FAILURE: ", err);
//     })
//     break;


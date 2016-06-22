'use strict';

// maestro: mqtt client on the API side of Pheromon
var mqtt = require('mqtt');
var checkSensor = require('./utils/checkSensor.js');
var makeMap = require('../tools/makeMap');
var sendReq = require('../tools/sendNodeReq');
var database = require('../database');
var Updater = require('./updater.js');
var PRIVATE = require('../PRIVATE/secret.json');

var SENSOR_STATUS = require('./utils/sensorStatus.js');

var sigCodec = require('pheromon-codecs').signalStrengths;

var createFakeSensor = require('../tools/createFakeSensor');

// Updater variables
var UPDATER_RANGE_START = parseInt(process.env.UPDATER_RANGE_START, 10) || 2200;
var UPDATER_RANGE_SIZE = parseInt(process.env.UPDATER_RANGE_SIZE, 10) || 50;
var UPDATER_PLAYBOOK_FOLDER = process.env.UPDATER_PLAYBOOK_FOLDER || '../updateFiles/';
var UPDATER_SENSORS_PORT = parseInt(process.env.UPDATER_SENSORS_PORT, 10) || 22;
// See PRIVATE.json
var UPDATER_SERVER_IP = PRIVATE.server_ip || 'localhost';
var BROKER_ADDRESS = process.env.NODE_ENV === 'test' ? 'broker' : 'localhost';
var BROKER_PORT = process.env.BROKER_PORT ? process.env.BROKER_PORT : 1883;

var subscribed = false; // ensures we don't ressubscribe twice when the broker is restarted

module.exports = function(authToken, io){

    var updater = new Updater(authToken, UPDATER_RANGE_START, UPDATER_RANGE_SIZE);

    var maestro = mqtt.connect('mqtt://'+ BROKER_ADDRESS + ':' + BROKER_PORT, {
        username: PRIVATE.mqtt_user,
        password: PRIVATE.mqtt_token,
        clientId: 'maestro'
    });

    maestro.on('connect', function () {

        if (!subscribed) {

            maestro.subscribe('init/#', {qos: 1});
            maestro.subscribe('disconnection/#', {qos: 1});
            maestro.subscribe('status/#', {qos: 1});
            maestro.subscribe('measurement/#', {qos: 1});
            maestro.subscribe('cmdResult/#', {qos: 1});
            maestro.subscribe('url/#', {qos: 1});
        }

        // wrapper of the mqtt.publish() function
        maestro.distribute = function(message){
            message.to.forEach(function(sim){
                maestro.publish(sim, message.command, {qos: 1});
            });
        };

        io.on('connection', function(socket) {
            socket.on('cmd', function(msg) {

                // check cmd token
                if (msg.token === PRIVATE.cmd_token){
                    console.log('cmd was received with correct token');
                    
                    var cmd = msg.cmd;

                    var commandLine = cmd.command.toLowerCase().split(' ');

                    // Special case : updates
                    // Start the updater instead of sending the message
                    if (commandLine[0] === 'startupdate') {

                        var playbook = commandLine[1] || 'default';
                        database.Sensors.getAll()
                        .then(function(sensors) {
                            try {
                                updater.cleanResults();
                                updater.startUpdate(UPDATER_PLAYBOOK_FOLDER + playbook,
                                cmd.to.map(function (sim) {
                                    return sensors.find(function (sensor) {
                                        return sensor.sim === sim;
                                    });
                                }),
                                'sensorSSH' + '@' + UPDATER_SERVER_IP,
                                UPDATER_SENSORS_PORT);
                            }
                            catch (err) {
                                console.log('Could not start the update', err, err.stack);
                                cmd.to.forEach(function (sim) {
                                    maestro.publish('cmdResult/' + sim + '/', {command: 'startUpdate', result: err});
                                });
                            }
                        })
                        .catch(function (err) {
                            console.log('Error :', err, err.stack);
                        });
                    }
                    else if (commandLine[0] === 'stopupdate')
                        updater.stopUpdate();
                    else
                        maestro.distribute(cmd);
                }
                else
                    console.log('cmd was received with wrong token');
                
            });
        });

        maestro.on('message', function(topic, message) {

            var subtopics = topic.split('/');

            var main = subtopics[0];
            var sim = subtopics[1];
            var type = subtopics[2];

            console.log('Maestro received:', main, sim, type);

            // maybe add a function to check topics

            checkSensor(sim, type)
            .then(function(sensor){

                switch(main){
                    case 'init':
                        database.Sensors.update(sensor.sim, {client_status: 'connected'}) // this is to set the sensor to 'CONNECTED' in D
                        .then(function() {
                            io.emit('status', {sensorId: sensor.id});
                            var cmd = [
                                'init',
                                sensor.period,
                                sensor.start_hour,
                                sensor.stop_hour,
                                new Date().toISOString()
                            ].join(' ');

                            maestro.publish(sim, cmd);

                            console.log('sensor init');
                        })
                        .catch(function(err) {
                            console.log('error : cannot update sensor in DB :', err);
                        });
                        break;

                    case 'status':
                        var deltaStatus = {};

                        // update only sensor, client and signal are reserved keywords
                        if (SENSOR_STATUS.has(type)){
                            deltaStatus[type + '_status'] = message;
                            database.Sensors.update(sensor.sim, deltaStatus)
                            .then(function() {
                                io.emit('status', {sensorId: sensor.id});
                                console.log(type, 'status data updated for sensor');
                            })
                            .catch(function(err) {
                                console.log('error : cannot store measurement in DB :', err);
                            });
                        }
                        // update only outputs
                        else {
                            deltaStatus['status'] = message;
                            database.Sensors.updateOutput(sensor.id, type, deltaStatus) // the output is linked to the id of the sensor, not to the sim
                            .then(function() {
                                io.emit('status', {sensorId: sensor.id});
                                console.log(type, 'status data updated for sensor');
                            })
                            .catch(function(err) {
                                console.log('error : cannot store measurement in DB :', err);
                            });
                        }
                        break;

                    case 'measurement':

                        /* measurement is
                            {
                                date:
                                value: [{}]
                                (index:) -> reference to the local pending promise
                                (origin:) -> so that pheromon knows it needs to send back smg
                            }
                        */
                        
                        var measurements = JSON.parse(message.toString());
                        
                        var outputId = makeMap(sensor.outputs, 'type').get(type).id;

                        measurements.forEach(function (measurement) {

                            var createMeasurementP = database.Measurements.create({
                                output_id: outputId,
                                value: measurement.value,
                                date: measurement.date
                            });

                            var updateSensorStatusP;
                            if (sensor.client_status === 'disconnected')
                                updateSensorStatusP = database.Sensors.update(sensor.sim, {client_status: 'connected'});
                            
                            Promise.all([createMeasurementP, updateSensorStatusP]).then(function() {
                                io.emit('data', {
                                    installed_at: sensor.installed_at,
                                    type: type,
                                    value: measurement.value,
                                    date: measurement.date
                                });                                      
                                console.log('measurement of type', type, 'updated');

                            })
                            .catch(function(err) {
                                console.log('error : cannot store measurement in DB :', err);
                            });
                        });
                        break;
                    
                    case 'cmdResult':
                        var parsedCommand = JSON.parse(message);
                        database.Sensors.update(sensor.sim, {
                            latest_input: parsedCommand.command,
                            latest_output: parsedCommand.result
                        })
                        .then(function() {
                            io.emit('status', {sensorId: sensor.id});
                            console.log('latest output updated');
                        })
                        .catch(function(err) {
                            console.log('error : cannot update sensor in DB :', err);
                        });
                        break;

                    case 'url':
                        var parsedUrl = JSON.parse(message);

                        /* Parsed message is
                            {
                                url:
                                method:
                                data:
                                origin: -> who asked ?
                                index: -> reference to the local pending promise
                            }
                        */

                        var timeoutP = new Promise(function(resolve, reject){
                            setTimeout(function(){
                                reject('Timeout');
                            }, 10000);
                        });

                        Promise.race([sendReq(parsedUrl.method, parsedUrl.url, parsedUrl.data), timeoutP])
                        .then(function(data){
                            var response = {
                                data: data,
                                isSuccessful: true,
                                index: parsedUrl.index
                            };
                            maestro.publish(sensor.sim + '/' + parsedUrl.origin, JSON.stringify(response));
                        })
                        .catch(function(){
                            var response = {
                                isSuccessful: false,
                                index: parsedUrl.index
                            };
                            maestro.publish(sensor.sim + '/' + parsedUrl.origin, JSON.stringify(response));
                        });

                }
            })
            .catch(function(err) {
                console.log('Error in checkSensor :', err.stack);
            });
        });

        console.log('Maestro ready');

    });

    // Fake sensor creation => use this to fake the behavior you need
    if (process.env.NODE_ENV === 'development'){
        var fakeSim = 'fakeSim';

        createFakeSensor(fakeSim, authToken)
        .then(function(fakeSensor){
            fakeSensor.publish('init/' + fakeSim, '');

            fakeSensor.on('message', function(topic, buffer) {
                var destination = topic.split('/')[1];

                var message = buffer.toString();
                var commandArgs = message.split(' ');
                var command = (commandArgs.length >= 1) ? commandArgs[0] : undefined;

                console.log('data received :', message, 'destination', destination);

                if (command === 'status'){
                    fakeSensor.publish('status/'+ fakeSim +'/wifi', 'recording');
                    fakeSensor.publish('status/'+ fakeSim +'/bluetooth', 'recording');
                    fakeSensor.publish('cmdResult/' + fakeSim, JSON.stringify({command: 'status', result: 'OK'}));
                } 
            });

            setInterval(function(){
                var measurement = {
                    date: new Date(),
                    devices: [{
                        signal_strength: -10,
                        ID: 'myID1'
                    },
                    {
                        signal_strength: -19,
                        ID: 'myID2'
                    },
                    {
                        signal_strength: -39,
                        ID: 'myID3'
                    }]
                };

                console.log('Measurement created');

                sigCodec.encode(measurement)
                .then(function(encoded){
                    console.log('publishing');
                    fakeSensor.publish('measurement/' + fakeSim + '/wifi', encoded);
                });

            }, 10000);
        })
        .catch(function(error){
            console.log('Couldnt connect the sensor', error);
        });
    }

    return maestro;
};

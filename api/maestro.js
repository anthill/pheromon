'use strict';

// maestro: mqtt client on the API side of Pheromon
var mqtt = require('mqtt');
var sigCodec = require('pheromon-codecs').signalStrengths;
var utils = require('./utils/maestro.js');
var debug = require('../tools/debug');
var database = require('../database');

var sim2sensor;

module.exports = function(authToken, io){

    var maestro = mqtt.connect('mqtt://broker:1883', {
        username: 'maestro',
        password: authToken,
        clientId: 'maestro'
    });

    maestro.on('connect', function () {

        utils.importSensors()
        .then(function(object){
            sim2sensor = object;

            maestro.subscribe('init/#');
            maestro.subscribe('status/#');
            maestro.subscribe('measurement/#');

            // wrapper of the mqtt.publish() function
            maestro.distribute = function(message){
                if (message.to.length === Object.keys(sim2sensor).length)
                    maestro.publish('all', message.command);
                    
                else
                    message.to.forEach(function(sim){
                        maestro.publish(sim, message.command);
                    });
            };

            io.on('connection', function(socket) {
                socket.on('cmd', function(cmd) {
                    console.log('admin client data received');
                    maestro.distribute(cmd);
                });
            });

            maestro.on('message', function(topic, message) {

                var subtopics = topic.split('/');

                var main = subtopics[0];
                var sim = subtopics[1];
                var type = subtopics[2];

                debug('Maestro received:', main, sim, type);

                // maybe add a function to check topics

                utils.checkSensor(sim, sim2sensor)
                .then(function(){
                    var sensor = sim2sensor[sim];

                    switch(main){
                        case 'init':
                            var date = new Date();
                            var cmd = ['init', sensor.period, sensor.start_hour, sensor.stop_hour, date.toISOString()].join(' ');
                            maestro.publish(sim, cmd);
                            break;

                        case 'status':
                            var delta = {};
                            delta[type + '_status'] = message;

                            database.Sensors.update(sensor.sim, delta)
                            .then(function(updated) {
                                sim2sensor[sim] = updated;
                                io.emit('status', {sensorId: sensor.id});
                                console.log(type + 'status data updated for sensor');
                            })
                            .catch(function(err) {
                                console.log('error : cannot store measurement in DB :', err);
                            });
                            break;

                        case 'measurement':
                            console.log('RECEIVED', message);
                            
                            sigCodec.decode(message)
                            .then(function(data){
                                /*
                                    {
                                        date:
                                        devices: [
                                            {
                                                signal_strengh:
                                                ID:
                                            }
                                        ]
                                    }
                                */
                                debug('Measurement to register', data);

                                database.Measurements.create({
                                    sensor_sim: sim,
                                    type: type,
                                    value: data.devices.map(function(device){
                                        return device.signal_strength;
                                    }),
                                    date: data.date
                                })
                                .then(function() {
                                    io.emit('data', {
                                        installed_at: sensor.installed_at,
                                        type: type,
                                        value: data.devices.length,
                                        date: data.date
                                    });
                                    console.log('measurement of type', type, 'updated');
                                })
                                .catch(function(err) {
                                    console.log('error : cannot store measurement in DB :', err);
                                }); 

                            })
                            .catch(function(err){
                                console.log('ERROR in decoding', err);
                            });
                                                   
                            break;
                        
                        case 'cmdResult':
                            database.Sensors.update(sensor.sim, {
                                latest_output: message
                            })
                            .then(function() {
                                io.emit('status', {sensorId: sensor.id});
                                console.log('latest output updated');
                            })
                            .catch(function(err) {
                                console.log('error : cannot update sensor in DB :', err);
                            });                        
                            break;

                    }
                });          
            });

            console.log('Maestro ready');
        });
    });

    return maestro;
};

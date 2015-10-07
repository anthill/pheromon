'use strict';

// maestro: mqtt client on the API side of Pheromon
var mqtt = require('mqtt');
var sigCodec = require('pheromon-codecs').signalStrengths;
var checkSensor = require('./utils/checkSensor.js');
var debug = require('../tools/debug');
var database = require('../database');

module.exports = function(authToken, io){

    var maestro = mqtt.connect('mqtt://broker:1883', {
        username: 'maestro',
        password: authToken,
        clientId: 'maestro'
    });

    maestro.on('connect', function () {

        maestro.subscribe('init/#');
        maestro.subscribe('status/#');
        maestro.subscribe('measurement/#');
        maestro.subscribe('cmdResult/#');

        // wrapper of the mqtt.publish() function
        maestro.distribute = function(message){
            database.Sensors.getAll()
            .then(function(sensors){
                if (message.to.length === sensors.length)
                    maestro.publish('all', message.command);
                    
                else
                    message.to.forEach(function(sim){
                        maestro.publish(sim, message.command);
                    });
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

            checkSensor(sim)
            .then(function(sensor){
                console.log('AFTER CHECK', sensor);

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
                        .then(function() {
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
                                value: data.devices.map(function (measurement) {
                                    return measurement.signal_strength;
                                }),
                                date: data.date
                            })
                            .then(function() {
                                io.emit('data', {
                                    installed_at: sensor.installed_at,
                                    type: type,
                                    value: data.devices.map(function (measurement) {
                                        return measurement.signal_strength;
                                    }),
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
                        var parsed = JSON.parse(message);
                        database.Sensors.update(sensor.sim, {
                            latest_input: parsed.command,
                            latest_output: parsed.result
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
            })
            .catch(function(err) {
                console.log('Error in checkSensor :', err.stack);
            });
        });

        console.log('Maestro ready');   

    });

    return maestro;
};

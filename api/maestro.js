'use strict';

// maestro: mqtt client on the API side of Pheromon
var mqtt = require('mqtt');
var sigCodec = require('pheromon-codecs').signalStrengths;
var trajCodec = require('pheromon-codecs').trajectories;
var checkSensor = require('./utils/checkSensor.js');
var debug = require('../tools/debug');
var makeMap = require('../tools/makeMap');
var database = require('../database');

var SENSOR_STATUS = require('./utils/sensorStatus.js');

// Decode a message in function of its type
function decodeMessage(message, type) {

    return new Promise(function (resolve, reject) {

        switch (type) {
            case 'wifi':
            case 'bluetooth':
                sigCodec.decode(message)
                .then(resolve)
                .catch(reject);
                /*
                    {
                        date:
                        devices: [
                            {
                                signal_strengh:
                            }
                        ]
                    }
                */

            break;

            case 'trajectories':
                trajCodec.decode(message)
                .then(resolve)
                .catch(reject);
                /*
                    [ // trajectories
                        [ // trajectory
                            { // point
                                date: Date(),
                                signal_strength: int
                            },
                            ...
                        ],
                        ...
                    ]
                */
            break;

            default:
                reject(new Error('measurement type not supported by decode'));
        }
    });
}

// Extract measurements informations from decoded data
function extractMeasurementsFromData(data, type) {
    switch (type) {
        case 'wifi':
        case 'bluetooth':
            return [ // wifi and bluetooth messages correspond to only one measurement
                {
                    value: data.devices.map(function (measurement) {
                        return measurement.signal_strength;
                    }),
                    date: data.date
                }];

        case 'trajectories': // trajectories messages contains many measurements (1 per trajectory)
            return data.map(function (trajectory) {
                return {
                    value: trajectory,
                    date: trajectory.reduce(function (previous, current) {
                        return previous.date.getTime() < current.date.getTime() ? previous : current;
                    }, trajectory[0]).date
                };
            });

        default:
            return null;
    }
}

module.exports = function(authToken, io){

    var maestro = mqtt.connect('mqtt://broker:1883', {
        username: 'maestro',
        password: authToken,
        clientId: 'maestro'
    });

    maestro.on('connect', function () {

        maestro.subscribe('init/#');
        maestro.subscribe('disconnection/#');
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

            console.log('Maestro received:', main, sim, type);

            // maybe add a function to check topics

            checkSensor(sim, type)
            .then(function(sensor){
                debug('AFTER CHECK', sensor);

                switch(main){
                    case 'init':
                        var date = new Date();

                        database.Sensors.update(sensor.sim, {client_status: 'connected'}) // this is to set the sensor to 'CONNECTED' in D
                        .then(function() {
                            io.emit('status', {sensorId: sensor.id});
                            var cmd = ['init', sensor.period, sensor.start_hour, sensor.stop_hour, date.toISOString()].join(' ');
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
                        
                        decodeMessage(message, type)
                        .then(function(data){
                            debug('Measurement to register', data, sensor.outputs);

                            var outputId = makeMap(sensor.outputs, 'type').get(type).id;
                            var measurements = extractMeasurementsFromData(data, type);

                            if (measurements) {
                                measurements.forEach(function (measurement) {

                                    database.Measurements.create({
                                        output_id: outputId,
                                        value: measurement.value,
                                        date: measurement.date
                                    })
                                    .then(function() {
                                        if (type === 'wifi'){ // for now
                                            io.emit('data', {
                                                installed_at: sensor.installed_at,
                                                type: type,
                                                value: measurement.value,
                                                date: measurement.date
                                            });
                                        }
                                        console.log('measurement of type', type, 'updated');
                                    })
                                    .catch(function(err) {
                                        console.log('error : cannot store measurement in DB :', err);
                                    });
                                });
                            }
                            else
                                console.log('Error extracing measurements from data');
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

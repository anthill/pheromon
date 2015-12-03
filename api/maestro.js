'use strict';

// maestro: mqtt client on the API side of Pheromon
var mqtt = require('mqtt');
var decoder = require('./utils/decodeMessage');
var checkSensor = require('./utils/checkSensor.js');
var debug = require('../tools/debug');
var makeMap = require('../tools/makeMap');
var sendReq = require('../tools/sendNodeReq');
var database = require('../database');
var Updater = require('./updater.js');
var PRIVATE = require('../PRIVATE.json');

var SENSOR_STATUS = require('./utils/sensorStatus.js');

// Updater variables
var UPDATER_RANGE_START = parseInt(process.env.UPDATER_RANGE_START, 10) || 2200;
var UPDATER_RANGE_SIZE = parseInt(process.env.UPDATER_RANGE_SIZE, 10) || 50;
var UPDATER_PLAYBOOK_FOLDER = process.env.UPDATER_PLAYBOOK_FOLDER || './';
var UPDATER_SENSOR_PORT = process.env.UPDATER_SENSOR_PORT || '9632';
// See PRIVATE.json
var UPDATER_SERVER_IP = PRIVATE.ip || 'localhost';


module.exports = function(authToken, io){

    var updater = new Updater(authToken, UPDATER_RANGE_START, UPDATER_RANGE_SIZE);

    var maestro = mqtt.connect('mqtt://broker:1883', {
        username: 'maestro',
        password: authToken,
        clientId: 'maestro'
    });

    maestro.on('connect', function () {

        maestro.subscribe('init/#', {qos: 1});
        maestro.subscribe('disconnection/#', {qos: 1});
        maestro.subscribe('status/#', {qos: 1});
        maestro.subscribe('measurement/#', {qos: 1});
        maestro.subscribe('cmdResult/#', {qos: 1});
        maestro.subscribe('url/#', {qos: 1});

        // wrapper of the mqtt.publish() function
        maestro.distribute = function(message){
            database.Sensors.getAll()
            .then(function(sensors){
                if (message.to.length === sensors.length)
                    maestro.publish('all', message.command, {qos: 1});
                    
                else
                    message.to.forEach(function(sim){
                        maestro.publish(sim, message.command, {qos: 1});
                    });
            });
        };

        io.on('connection', function(socket) {
            socket.on('cmd', function(msg) {

                // check cmd token
                if (msg.token === PRIVATE.cmdToken){
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
                                UPDATER_SENSOR_PORT);
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

                        /* measurement is
                            {
                                date:
                                value: [{}]
                                (index:) -> reference to the local pending promise
                                (origin:) -> so that pheromon knows it needs to send back smg
                            }
                        */
                        
                        decoder.decodeMessage(message, type)
                        .then(function(data){
                            debug('Measurement to register', data, sensor.outputs);

                            var outputId = makeMap(sensor.outputs, 'type').get(type).id;
                            var measurements = decoder.extractMeasurementsFromData(data, type);

                            if (measurements) {
                                measurements.forEach(function (measurement) {

                                    database.Measurements.create({
                                        output_id: outputId,
                                        value: measurement.value,
                                        date: measurement.date
                                    })
                                    .then(function() {
                                        switch(type){
                                            case 'wifi':
                                                io.emit('data', {
                                                    installed_at: sensor.installed_at,
                                                    type: type,
                                                    value: measurement.value,
                                                    date: measurement.date
                                                });
                                                break;

                                            // THIS IS 6ELEMENT SPECIFIC CODE :/
                                            case 'bin':
                                                /* we need to send a websocket msg to pass the info to 6element server */
                                                io.emit('bin', measurement.value);

                                                maestro.publish(sensor.sim + '/' + measurement.origin, JSON.stringify({
                                                    isSuccessful: true,
                                                    index: measurement.index
                                                }));
                                                break;

                                        }
                                        console.log('measurement of type', type, 'updated');
                                    })
                                    .catch(function(err) {
                                        console.log('error : cannot store measurement in DB :', err);

                                        // THIS IS 6ELEMENT SPECIFIC CODE :/
                                        if (type === 'bin'){
                                            maestro.publish(sensor.sim + '/' + measurement.origin, JSON.stringify({
                                                error: err,
                                                isSuccessful: false,
                                                index: measurement.index
                                            }));
                                        }
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

                    case 'url':
                        var parsed = JSON.parse(message);

                        /* parsed message is
                            {
                                url:
                                method:
                                data:
                                origin: -> who asked ?
                                index: -> reference to the local pending promise
                            }
                        */

                        sendReq(parsed.method, parsed.url, parsed.data)
                        .then(function(data){
                            var response = {
                                data: data,
                                isSuccessful: true,
                                index: message.index
                            };
                            maestro.publish(sensor.sim + '/' + parsed.origin, JSON.stringify(response));
                        })
                        .catch(function(error){
                            var response = {
                                error: error,
                                isSuccessful: false,
                                index: message.index
                            };
                            maestro.publish(sensor.sim + '/' + parsed.origin, JSON.stringify(response));
                        });

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

'use strict';

require('es6-shim');

var EventEmitter = require('events').EventEmitter;
var mqtt = require('mqtt');
var util = require('util');
var ansible = require('node-ansible');
var exec = require('child_process').exec;

// Start ansible for one or more sensor(s)
function updateSensors(ansiblePlaybook, addresses) {
    return new Promise(function (resolve, reject) {

        console.log('========== Starting to update', addresses, '==========');

        var command = new ansible.Playbook()
        .playbook(ansiblePlaybook)
        .inventory(addresses.concat(['']).join(', ').trim())
        .verbose('vvvv')
        .user('root');

        command.on('stdout', function(data) { console.log(data.toString()); });
        command.on('stderr', function(data) { console.log(data.toString()); });

        command.exec({cwd: __dirname})
        .then(function (result) {
            console.log(result);
            resolve(result);
        }, function (err) {
            console.log(err);
            reject(err);
        })
        .catch(function (err) {
            reject(err);
        });

    });
}

// Create an updater connected to the MQTT broker
// Port range for the updater : [RANGE_START; RANGE_START + RANGE_SIZE - 1]

function PheromonUpdater (mqttToken, RANGE_START, RANGE_SIZE) {

    var self = this;
    var hostIP;

    // Get the IP of the docker host
    exec('ip ro get 8.8.8.8 | grep -oP "(?<=via )([\\d\\.]+)"', function (err, stdout) {
        hostIP = stdout.toString().replace('\n', '').trim();
        return (err);
    });


    if (typeof mqttToken !== 'string') // Incorect token
        throw new Error('PheromonUpdater: Bad MQTT Token');

    if ((RANGE_START & 0xFFFF) !== RANGE_START) // not a correct port number
        throw new Error('PheromonUpdater: Bad RANGE_START');

    if (typeof RANGE_SIZE !== 'number' ||
        RANGE_SIZE <= 0 || // Incorrect size
        ((RANGE_START + RANGE_SIZE) & 0xFFFF) !== RANGE_START + RANGE_SIZE)  // Port range overflow
        throw new Error('PheromonUpdater: Bad RANGE_SIZE (or port range overflow)');

    EventEmitter.call(self);

    var mqttClient = mqtt.connect('mqtt://broker:1883', {
        username: 'updater',
        password: mqttToken,
        clientId: 'updater'
    });

    mqttClient.on('connect', function () {
        mqttClient.subscribe('cmdResult/#');
        self.emit('connected');
    });

    var port2sensor = []; // [{port:number, sensor:object}, {port:number, sensor:object}, ...]

    var sensors = [];

    // Send an opentunnel command to a sensor
    function askTunnel(sensor, serverPort, sensorPort, address) {

        console.log('Sending opentunnel to',
                    sensor.id,
                    '(' + (sensors.filter(function (s) {return s.state !== 'PENDING';}).length + 1) +
                    '/' + sensors.length + ')');

        mqttClient.publish(sensor.id,
            'opentunnel ' + serverPort + ' ' + sensorPort + ' ' + address,
            {qos: 1});

        sensor.timeout = setTimeout(function () {
            self.emit('timeout', sensor.id);
            sensor.state = 'TIMEOUT';

            mqttClient.publish(sensor.id,
                'closetunnel',
                {qos: 1});

            startNewUpdate(sensor, sensorPort, address);

        }, 30 * 1000);

    }

    // Start the update on a new sensor when the old one is done.
    function startNewUpdate(oldSensor, sensorPort, address) {

        // Find a next sensor and start its update
        var nextSensor = sensors.find(function (s) {
            return s.state === 'PENDING';
        });

        var portAndSensor = port2sensor.find(function (obj) {
            return obj.sensor.id === oldSensor.id;
        });

        if (!portAndSensor) // Should not happen
            return;

        portAndSensor.sensor = nextSensor;
        if (nextSensor)
            setTimeout(function () { // Wait until port is freed and start next update
                askTunnel(nextSensor, portAndSensor.port, sensorPort, address);
            }, 1000);
    }

    // Start an update.
    // ansiblePlaybook : path to a playbook
    // _sensors : array of objects containing a sim property
    // address : server IP to send to the sensor.
    self.startUpdate = function startUpdate(ansiblePlaybook, _sensors, address, sensorPort) {

        if (!_sensors || !_sensors.length || _sensors.find(function (s) {return s.sim === undefined;}) ||
            !ansiblePlaybook ||
            !address)
            throw new Error('Bad parameters.');

        if (sensors.find(function (s) {
            return s.state === 'PENDING' || s.state === 'STARTING';
        }) !== undefined)
            throw new Error('Update already started');


        // If not a good port number --> default value
        if ((sensorPort & 0xFFFF) !== sensorPort)
            sensorPort = 9632;
        
        mqttClient.removeAllListeners('message');

        console.log('==========',
                    'starting update for sensors :',
                    _sensors.map(function (s) {return s.sim;}),
                    '==========');
        console.log('==========',
                    'using playbook :',
                    ansiblePlaybook+'.yml',
                    '==========');

        sensors = _sensors.map(function (sensor) {
            return {id: sensor.sim, state: 'PENDING'};
        });


        // Ask RANGE_SIZE sensors to open a tunnel
        sensors
        .filter(function (sensor) {
            return sensor.state === 'PENDING';
        })
        .slice(0, RANGE_SIZE)
        .forEach(function (sensor, index) {
            var obj = port2sensor.find(function (o) {
                return o === RANGE_START + index;
            });

            if (!obj) {
                obj = {port: RANGE_START + index, sensor: sensor};
                port2sensor.push(obj);
            }

            askTunnel(sensor, RANGE_START + index, sensorPort, address);
        });


        // Listen for tunnel success events and start the update with ansible
        mqttClient.on('message', function (topic, message) {
            var subtopics = topic.split('/');
            var main = subtopics[0];
            var sim = subtopics[1];

            if (main !== 'cmdResult')
                return;

            var parsed = JSON.parse(message);

            var sensor = sensors.find(function(s) {
                return s.id === sim;
            });

            if (!sensor || !parsed)
                return;

            if (parsed.command === 'opentunnel' && parsed.result === 'OK') {
                if (sensor.state === 'PENDING') {
                    self.emit('start', sensor);
                    sensor.state = 'STARTED';

                    if (sensor.timeout)
                        clearTimeout(sensor.timeout);

                    // Start the update of the sensor
                    updateSensors(ansiblePlaybook, [hostIP + ':' + (port2sensor.find(function (o) {
                            return o.sensor && o.sensor.id === sensor.id;
                        }).port).toString(10)])

                    .then(function () {
                        console.log('========== SUCCESS ==========');
                        sensor.state = 'SUCCESS';
                        self.emit('success', sensor);

                        // Free the port and start the update for a new sensor
                        mqttClient.publish(sensor.id, 'closetunnel');
                        mqttClient.publish(sensor.id, 'reboot');
                        startNewUpdate(sensor, sensorPort, address);

                        mqttClient.publish('cmdResult/'+sensor.id, JSON.stringify({command: 'startUpdate', result: 'SUCCESS'}));
                    })

                    .catch(function (error) {
                        console.log('========== FAIL ==========');
                        sensor.state = 'FAIL';
                        self.emit('fail', sensor);
                        console.error(error);

                        // Free the port and start the update for a new sensor
                        mqttClient.publish(sensor.id, 'closetunnel');
                        startNewUpdate(sensor, sensorPort, address);

                        mqttClient.publish('cmdResult/'+sensor.id, JSON.stringify({command: 'startUpdate', result: 'FAIL'}));
                    });
                }
            }
        });
    };

    self.stopUpdate = function stopUpdate() {

        mqttClient.removeAllListeners('message');

        sensors.forEach(function (sensor) {
            if (sensor.state === 'STARTED') {
                mqttClient.publish(sensor.id, 'closetunnel', {qos: 1});
                mqttClient.publish('cmdResult/'+sensor.id, JSON.stringify({command: 'startUpdate', result: 'ABORTED'}));
                sensor.state = 'ABORTED';
            } else if (sensor.state === 'PENDING') {
                sensor.state = 'ABORTED';
            }
        });
    };

    self.cleanResults = function cleanResults() {

        if (sensors.filter(function (sensor) {
            return sensor.state === 'PENDING' || sensor.state === 'STARTED';
        }).length === 0) {
            sensors = [];
            port2sensor = [];
        }
        else
            return new Error('cannot clean results, update still pending');
    };
}

util.inherits(PheromonUpdater, EventEmitter);

module.exports = PheromonUpdater;

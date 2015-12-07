'use strict';
require('es6-shim');

var sigCodec = require('pheromon-codecs').signalStrengths;
var trajCodec = require('pheromon-codecs').trajectories;

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = chai.expect;
var assert = chai.assert;

var io = require('socket.io-client');

var request = require('request');
var PRIVATE = require('../../PRIVATE/secret.json');

var database = require('../../database');
var sendReq = require('../../tools/sendNodeReq');
var makeMap = require('../../tools/makeMap');
var createFakeSensor = require('../../tools/createFakeSensor');

var prepareAPI = require('../../tools/prepareAPI.js');
var apiOrigin = 'http://api:4000';
var api = prepareAPI(sendReq, apiOrigin);
var apiSecret = prepareAPI(sendReq, apiOrigin, PRIVATE.html_token);

var socket = io(apiOrigin);

var checkSensor = require('../../api/utils/checkSensor.js');

describe('Maestro testing', function(){

    this.timeout(2000);

    // before all tests, clear the table
    before('Clearing Sensor table', function(){
        return database.Sensors.deleteAll();
    });

    // after all tests, clear the table
    after('Clearing Sensor table', function(){

        return database.Measurements.deleteAll() 
        .then(function(){
            return database.Sensors.deleteAll();
        });
    });

    describe('Maestro utils', function(){
        // after each test, clear the table
        afterEach('Clearing Sensor Table', function(){
            return database.Sensors.deleteAll();
        });

        describe('checkSensor', function() {
        
            var sensor = {
                name: 'Sensor1',
                sim: '290'
            };

            var sim2sensor = {};

            it('should register unknown sensor', function () {
                return checkSensor(sensor.sim)
                .then(function(){
                    return database.Sensors.getAll()
                    .then(function(sensors){
                        expect(sensors.length).to.deep.equal(1);
                    });
                });
            });

            it('should not register known sensor', function () {
                return checkSensor(sensor.sim)
                .then(function(){
                    return database.Sensors.getAll()
                    .then(function(sensors){
                        expect(sensors.length).to.deep.equal(1);
                    });
                });
            });

            it('should not add already existing output', function () {
                return checkSensor(sensor.sim, 'wifi')
                .then(function(){
                    return checkSensor(sensor.sim, 'wifi');
                })
                .then(function(){
                    return checkSensor(sensor.sim, 'signal');
                })
                .then(function(){
                    return database.Sensors.get(sensor.sim)
                    .then(function(sensor){
                        expect(sensor.outputs.length).to.deep.equal(1);
                    });
                });
            });
        });

    });

    describe('Maestro', function() {

        var fakeSensor;
        var i = 0;
        var simId;

        // This is mainly to override the 'onMessage' event handler.
        beforeEach('Creating Fake Sensor', function(){
            i++;
            simId = 'simNumber' + i;
            return createFakeSensor(simId, PRIVATE.mqtt_token)
            .then(function(sensor){
                fakeSensor = sensor;
            });
        });

        it('should register unknown sensor', function () {

            return new Promise(function(resolve, reject){
                fakeSensor.on('message', function () {
                    setTimeout(function(){
                        resolve(apiSecret.getAllSensors()
                        .then(function(sensors){
                            expect(sensors[0].sim).to.deep.equal('simNumber1');
                        }));
                    }, 200);
                });

                setTimeout(function () { // Wait for maestro to connect
                    fakeSensor.publish('init/' + simId, '');
                }, 300);
            });

        });

        it('should send back init command when asked', function () {
            // sensor sends '' on topic 'init/simId'
            // then receives 'init params' on topic 'simId'

            return new Promise(function(resolve, reject){
                fakeSensor.on('message', function(topic, message){
                    if(topic === simId || 'all') {
                        var argsplit = message.toString().split(' ');

                        expect(argsplit[0]).to.deep.equal('init');
                        // check parameters are numbers
                        expect(Number.isNaN(Number(argsplit[1]))).to.be.false;
                        expect(Number.isNaN(Number(argsplit[2]))).to.be.false;
                        expect(Number.isNaN(Number(argsplit[3]))).to.be.false;
                        // check for proper datetime
                        expect(Date.parse(argsplit[4])).to.be.a('number');
                        resolve();
                    }
                });

                fakeSensor.publish('init/' + simId, '');
            });
        });

        it('should register output status update in DB', function () {

            fakeSensor.publish('status/' + simId + '/wifi', 'recording');            
            
            return new Promise(function(resolve, reject){
                setTimeout(function(){
                    resolve(apiSecret.getSensor(simId)
                    .then(function(sensor){
                        var outputs = makeMap(sensor.outputs, 'type');
                        expect(outputs.get('wifi').status).to.deep.equal('recording');
                    }));

                }, 300);
            });
        });

        // add test for client status

        it('should register measurements in DB when receiving wifi measurements', function () {

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

            return sigCodec.encode(measurement)
            .then(function(encoded){
                fakeSensor.publish('measurement/' + simId + '/wifi', encoded);

                var data = {
                    sims: [simId],
                    types: ['wifi']
                };

                return new Promise(function(resolve, reject){
                    setTimeout(function(){

                        resolve(apiSecret.measurementsSensors(data)
                        .then(function(measurements){
                            expect(measurements[0].value[0]).to.deep.equal(-39); // signal strengths are sorted when encoded.
                            expect(measurements[0].entry).to.equal(3);
                            expect(Date.parse(measurements[0].date)).to.be.a('number');
                        }));

                    }, 200);
                });
            });
        });

        it('should register measurements in DB when receiving trajectories', function () {

            var trajectories =
            [
                [
                    {
                        date: new Date(),
                        signal_strength: -35
                    },

                    {
                        date: new Date(),
                        signal_strength: -55
                    }
                ],
                [
                    {
                        date: new Date(new Date().getTime() - 1000 * 60 * 30),
                        signal_strength: -80
                    }
                ]
            ];

            return trajCodec.encode(trajectories)
            .then(function(encoded){
                fakeSensor.publish('measurement/' + simId + '/trajectories', encoded);

                var data = {
                    sim: simId,
                    type: 'trajectories'
                };

                return new Promise(function(resolve, reject){
                    setTimeout(function(){

                        resolve(apiSecret.sensorRawMeasurements(data)
                        .then(function(measurements){
                            expect(measurements[0].value[0].signal_strength).to.deep.equal(-35);
                            expect(measurements[1].value[0].signal_strength).to.deep.equal(-80);
                            expect(Date.parse(measurements[0].date)).to.be.a('number');
                        }));

                    }, 200);
                });
            });
        });


        it('should send command to sensors when receiving commands through socket', function(){
            return new Promise(function(resolve, reject){
                fakeSensor.on('message', function(topic, message){

                    if(topic === simId || 'all') {
                        expect(message.toString()).to.deep.equal('myCommand');
                        resolve();
                    }
                });

                setTimeout(function () { // Wait for sensor to connect
                    socket.emit('cmd', {
                        token: PRIVATE.cmd_token,
                        cmd: {
                            command: 'myCommand',
                            to: [simId]
                        }
                    });
                }, 250);

            });
        });

        it('should forward the result when receiving a url via MQTT)', function(){
            return new Promise(function(resolve, reject){
                fakeSensor.on('message', function(topic, message){
                    var subtopics = topic.split('/');
                    var main = subtopics[0];
                    var destination = subtopics[1];

                    var parsed = JSON.parse(message.toString());

                    if(main === simId || 'all') {
                        expect(destination).to.deep.equal('test');
                        expect(parsed.data).to.exist;
                        expect(parsed.isSuccessful).to.be.true;
                        resolve();
                    }
                    else
                        reject();
                });

                fakeSensor.publish('url/' + simId, JSON.stringify({
                    url: 'https://pheromon.ants.builders/place/getAll',
                    method: 'GET',
                    origin: 'test',
                    index: 1
                }));

            // fakeSensor.publish('init/' + simId, '');

            });
        });

        it('should forward the error when receiving a invalid url via MQTT', function(){
            return new Promise(function(resolve, reject){
                fakeSensor.on('message', function(topic, message){
                    var subtopics = topic.split('/');
                    var main = subtopics[0];
                    var destination = subtopics[1];

                    var parsed = JSON.parse(message.toString());

                    if(main === simId || 'all') {
                        expect(destination).to.deep.equal('test');
                        expect(parsed.error).to.exist;
                        expect(parsed.isSuccessful).to.be.false;
                        resolve();
                    }
                    else
                        reject();
                });

                fakeSensor.publish('url/' + simId, JSON.stringify({
                    url: 'https://pheromon.ants.builders/fakeRoute',
                    method: 'GET',
                    origin: 'test',
                    index: 1
                }));

            });
        });

        it('should publish on simId/6bin when receiving a bin measurement', function(){
            return new Promise(function(resolve, reject){
                fakeSensor.on('message', function(topic, message){
                    var subtopics = topic.split('/');
                    var main = subtopics[0];
                    var destination = subtopics[1];

                    var parsed = JSON.parse(message.toString());

                    if(main === simId || 'all') {
                        expect(destination).to.deep.equal('6bin');
                        expect(parsed.isSuccessful).to.be.true;
                        resolve();
                    }
                    else
                        reject();
                });

                fakeSensor.publish('measurement/' + simId + '/bin', JSON.stringify({
                    date: new Date(Date.now()).toISOString(),
                    value: [{ id: 'myBinId' }],
                    index: 1,
                    origin: '6bin'
                }));

            });
        });

        it('should publish on simId/6bin when a bin measurement is not valid', function(){
            return new Promise(function(resolve, reject){
                fakeSensor.on('message', function(topic, message){
                    var subtopics = topic.split('/');
                    var main = subtopics[0];
                    var destination = subtopics[1];

                    var parsed = JSON.parse(message.toString());

                    if(main === simId || 'all') {
                        expect(destination).to.deep.equal('6bin');
                        expect(parsed.isSuccessful).to.be.false;
                        resolve();
                    }
                    else
                        reject();
                });

                // the following measurement is not valid, since it doesn't have a value field
                fakeSensor.publish('measurement/' + simId + '/bin', JSON.stringify({
                    date: new Date(Date.now()).toISOString(),
                    index: 1,
                    origin: '6bin'
                }));

            });
        });               

    });
});


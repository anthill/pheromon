'use strict';
require('es6-shim');

var sigCodec = require('pheromon-codecs').signalStrengths;

/* TODO
    - Sensor latest measurement update changes when measurement is registered in DB
*/

var mqtt = require('mqtt');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = chai.expect;
var assert = chai.assert;

var io = require('socket.io-client');

var request = require('request');
var PRIVATE = require('../../PRIVATE.json');

var database = require('../../database');
var sendReq = require('../../tools/sendNodeReq');

var prepareAPI = require('../../tools/prepareAPI.js');
var apiOrigin = 'http://api:4000';
var api = prepareAPI(sendReq, apiOrigin);

var socket = io(apiOrigin);

var maestroUtils = require('../../api/utils/maestro.js');

function createFakeSensor(simId){
    return new Promise(function(resolve, reject){
        var newSensor = mqtt.connect('mqtt://broker:1883', {
            username: simId,
            password: PRIVATE.token,
            clientId: simId
        });

        newSensor.on('connect', function(){
            newSensor.subscribe(simId);
            newSensor.subscribe('all');
            resolve(newSensor);
        });
    });
}

describe('Maestro testing', function(){

    this.timeout(2000);

    // before all tests, clear the table
    before('Clearing Sensor table', function(){
        console.log('Clearing Sensor table');
        return database.Sensors.deleteAll();
    });

    // after all tests, clear the table
    after('Clearing Sensor table', function(){
        console.log('Clearing Sensor table');

        return database.Measurements.deleteAll() 
        .then(function(){
            return database.Sensors.deleteAll();
        });
    });

    describe('Maestro utils', function(){
        // after each test, clear the table
        afterEach('Clearing Sensor Table', function(){
            console.log('After: Clearing Sensor table');
            return database.Sensors.deleteAll();
        });

        describe('checkSensor utils', function() {
        
            var sensor = {
                name: 'Sensor1',
                sim: '290'
            };

            var sim2sensor = {};

            it('checkSensor should register unknown sensor', function () {
                return maestroUtils.checkSensor(sensor.sim, sim2sensor)
                .then(function(wasSensorCreated){
                    expect(Object.keys(sim2sensor).length).to.deep.equal(1);
                    expect(wasSensorCreated).to.be.true;
                });
            });

            it('checkSensor should not register known sensor', function () {
                return maestroUtils.checkSensor(sensor.sim, sim2sensor)
                .then(function(wasSensorCreated){
                    expect(wasSensorCreated).to.be.false;
                });
            });
        });

        describe('importSensor utils', function() {

            before('Creating sensors in DB', function(){
                var creationPs = [0, 1, 2, 3].map(function(item){

                    var sensor = {
                        name: 'Sensor' + item,
                        sim: item * 10
                    };

                    return api.createSensor(sensor);
                });

                return Promise.all(creationPs);    
            });

            it('importSensor should return an object with all sensors in DB', function () {
                return maestroUtils.importSensors()
                .then(function(sim2sensor){
                    expect(Object.keys(sim2sensor).length).to.deep.equal(4);
                });
            });
        });

    });

    describe('Fake Sensor', function() {

        var fakeSensor;
        var simId = 'simNumber1';

        beforeEach('Creating Fake Sensor', function(){
            console.log('Before: creating fake sensor');
            return createFakeSensor(simId)
            .then(function(sensor){
                fakeSensor = sensor;
            });
        });

        it('Maestro should register unknown sensor', function () {

            fakeSensor.publish('init/' + simId, '');
            
            return new Promise(function(resolve, reject){
                setTimeout(function(){
                    api.getAllSensors()
                    .then(function(sensors){
                        expect(sensors[0].sim).to.deep.equal('simNumber1');
                        resolve();
                    })
                    .catch(function(err){
                        reject(err);
                    });

                }, 200);
            });
        });

        it('Maestro should send back init command when asked', function () {
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

        it('Maestro should register sensor status update in DB', function () {

            fakeSensor.publish('status/' + simId + '/wifi', 'recording');
            
            return new Promise(function(resolve, reject){
                setTimeout(function(){
                    api.getSensor(simId)
                    .then(function(sensor){
                        expect(sensor.wifi_status).to.deep.equal('recording');
                        resolve();
                    })
                    .catch(function(err){
                        reject(err);
                    });

                }, 200);
            });
        });

        it('Pushing wifi measurements should register measurements in DB', function () {

            var measurement = [{
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
            }];

            return sigCodec.encode(measurement)
            .then(function(encoded){
                fakeSensor.publish('measurement/' + simId + '/wifi', encoded);

                var data = {
                    sim: simId,
                    type: 'wifi'
                };

                return new Promise(function(resolve, reject){
                    setTimeout(function(){

                        api.getMeasurements(data)
                        .then(function(measurements){
                        //     // console.log('THEN');
                            console.log('measurements', measurements);
                            expect(measurements[0].value[0].signal_strength).to.deep.equal(-10);
                            expect(measurements[0].entry).to.equal(3);
                            expect(Date.parse(measurements[0].date)).to.be.a('number');
                            resolve();
                        })
                        .catch(function(err){
                            reject(err);
                        });

                    }, 200);
                });
            });
        });

        it('Emitting commands through socket should send command to sensors', function(){
            return new Promise(function(resolve, reject){
                fakeSensor.on('message', function(topic, message){
                    console.log('handleCMD', message.toString());

                    if(topic === simId || 'all') {
                        expect(message.toString()).to.deep.equal('myCommand');
                        resolve();
                    }
                });

                socket.emit('cmd', {
                    command: 'myCommand',
                    to: [simId]
                });

            });
        });

    });
});


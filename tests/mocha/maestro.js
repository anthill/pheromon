"use strict";
require('es6-shim');

/* TODO

    - Command management with socketIO => no need to check all commands, only that client receives the correct string
    - Sensor latest measurement update changes when measurement is registered in DB
    - sensor status update

*/

var mqtt = require('mqtt');
var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var expect = chai.expect;
var assert = chai.assert;

var request = require('request');
var PRIVATE = require('../../PRIVATE.json');

var database = require('../../database');
var sendReq = require('../../tools/sendNodeReq');

var prepareAPI = require('../../tools/prepareAPI.js');
var apiOrigin = 'http://api:4000';
var api = prepareAPI(sendReq, apiOrigin);

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
            resolve(newSensor);
        });
    });
}

describe('Maestro testing', function(){

    this.timeout(5000);

    // before all tests, clear the table
    before('Clearing Sensor table', function(){
        return database.Sensors.deleteAll();
    });

    // after each test, clear the table
    afterEach('Clearing Sensor Table', function(){
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

    describe('Sensor Registration / Fake sensor', function() {

        var fakeSensor;
        var simId = 'simNumber1';

        before('Creating Fake Sensor', function(){
            return createFakeSensor(simId)
            .then(function(sensor){
                fakeSensor = sensor;
            });
        });

        it('Maestro should register unknown sensor', function () {

            fakeSensor.publish('init/' + simId, "");
            
            setTimeout(function(){
                return api.getAllSensors()
                .then(function(sensors){
                    expect(sensors[0].sim).to.deep.equal(simId);
                })

            }, 500);
        });

        it('Maestro should send back init command when asked', function () {
            // sensor sends '' on topic 'init/simId'
            // then receives 'init params' on topic 'simId'

            return new Promise(function(resolve, reject){
                fakeSensor.on('message', function (topic, message) {
                    if(topic === simId || 'all') {
                        var argsplit = message.toString().split(" ");

                        expect(argsplit[0]).to.deep.equal('init');
                        // check parameters are numbers
                        expect(Number.isNaN(Number(argsplit[1]))).to.be.false;
                        expect(Number.isNaN(Number(argsplit[2]))).to.be.false;
                        expect(Number.isNaN(Number(argsplit[3]))).to.be.false;
                        // check for proper datetime
                        expect(Date.parse(argsplit[4])).to.be.a("number");
                        resolve();
                    }
                });

                fakeSensor.publish('init/' + simId, "");
            });
        });

        it('Maestro should register sensor status update', function () {

            fakeSensor.publish('status/' + simId + '/wifi', "recording");
            
            setTimeout(function(){
                return api.getSensor(simId)
                .then(function(sensor){
                    expect(sensor.sense_status).to.deep.equal('recording');
                });

            }, 500);
        });

        it('Pushing wifi measurements', function () {

            var measurement = {
                datetime: new Date(),
                signal_strength: [-10, -9, -99]
            };

            fakeSensor.publish("measurement/" + simId + "/wifi", JSON.stringify(measurement));

            setTimeout(function(){

                var data = {
                    sim: simId,
                    type: 'wifi'
                };

                return api.getMeasurements(data)
                .then(function(measurements){
                    console.log('Measurements', measurements);
                    expect(measurements[0].value).to.deep.equal([-10, -9, -99]);
                    expect(measurements[0].entry).to.equal(3);
                    expect(Date.parse(measurements[0].date)).to.be.a("number");
                })
            }, 500);

        });

    });

    // describe('Sensor Initialization', function() {

    //     var fakeSensor;
    //     var simId = 'simNumber1';

    //     before('Creating Fake Sensor', function(){
    //         return createFakeSensor(simId)
    //         .then(function(sensor){
    //             fakeSensor = sensor;
    //         });
    //     });
    // });


/*
    describe('Sensor Status update', function() {

        var fakeSensor;
        var simId = 'simNumber1';

        before('Creating Fake Sensor', function(){
            return createFakeSensor(simId)
            .then(function(sensor){
                fakeSensor = sensor;
            });
        });
        
        it('Maestro should send back init command when asked', function () {
            // sensor sends '' on topic 'init/simId'
            // then receives 'init params' on topic 'simId'

            return new Promise(function(resolve, reject){
                fakeSensor.on('message', function (topic, message) {
                    if(topic === simId || 'all') {
                        var argsplit = message.toString().split(" ");

                        expect(argsplit[0]).to.deep.equal('init');
                        // check parameters are numbers
                        expect(Number.isNaN(Number(argsplit[1]))).to.be.false;
                        expect(Number.isNaN(Number(argsplit[2]))).to.be.false;
                        expect(Number.isNaN(Number(argsplit[3]))).to.be.false;
                        // check for proper datetime
                        expect(Date.parse(argsplit[4])).to.be.a("number");
                        resolve();
                    }
                });

                fakeSensor.publish('init/' + simId, "");
            });
        });
    });
*/

    // describe('Measurements push', function(){

    //     var fakeSensor;
    //     var simId = 'simNumber1';

    //     before('Creating Fake Sensor', function(){
    //         return createFakeSensor(simId)
    //         .then(function(sensor){
    //             fakeSensor = sensor;
    //         });
    //     });

        
    // });
});


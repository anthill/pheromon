"use strict";
require('es6-shim');

/* TODO

    - Command management with socketIO => no need to check all commands, only that client receives the correct string
    - maestro Check sensor
    - maestro Import sensors

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

describe('Maestro testing', function(){

    this.timeout(5000);

    beforeEach(function(){
        return database.Sensors.deleteAll();
    });

    describe('Sensor Registration', function() {

        var fakeSensor;
        var simId = "simNumber1";

        before('Creating Fake Sensor', function(){
            return new Promise(function(resolve, reject){
                fakeSensor = mqtt.connect('mqtt://broker:1883', {
                    username: simId,
                    password: PRIVATE.token,
                    clientId: simId
                });

                fakeSensor.on('connect', function(){
                    resolve(fakeSensor);
                });
            })
            .then(function(sensor){
                sensor.subscribe(simId);
                fakeSensor = sensor;
            });
        });

        it('maestro should register unknown sensor', function () {

            fakeSensor.publish('init/' + simId, "");
            
            setTimeout(function(){
                return api.getAllSensors()
                .then(function(sensors){
                    expect(sensors[0].sim).to.deep.equal(simId);
                })

            }, 500);
        });
    });

    describe('Sensor Initialization', function() {

        var fakeSensor;
        var simId = "simNumber1";

        before('Creating Fake Sensor', function(){
            return new Promise(function(resolve, reject){
                fakeSensor = mqtt.connect('mqtt://broker:1883', {
                    username: simId,
                    password: PRIVATE.token,
                    clientId: simId
                });

                fakeSensor.on('connect', function(){
                    resolve(fakeSensor);
                });
            })
            .then(function(sensor){
                sensor.subscribe(simId);
                fakeSensor = sensor;
            });
        });
        
        it('broker should send back init command when asked', function () {
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

    describe('Measurements push', function(){

        var fakeSensor;
        var simId = "simNumber1";

        before('Creating Fake Sensor and Measurements', function(){
            return new Promise(function(resolve, reject){
                fakeSensor = mqtt.connect('mqtt://broker:1883', {
                    username: simId,
                    password: PRIVATE.token,
                    clientId: simId
                });

                fakeSensor.on('connect', function(){
                    resolve(fakeSensor);
                });

            })
            .then(function(sensor){
                sensor.subscribe(simId);
                fakeSensor = sensor;
            });
        });

        it('pushing wifi measurements', function (done) {

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
                    expect(measurements[0].value).to.deep.equal([-10, -9, -99]);
                    expect(measurements[0].entry).to.equal(3);
                    expect(Date.parse(measurements[0].date)).to.be.a("number");
                })
            }, 500);

        });
    });
});


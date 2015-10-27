'use strict';
require('es6-shim');

var sigCodec = require('pheromon-codecs').signalStrengths;

var mqtt = require('mqtt');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = chai.expect;
var assert = chai.assert;

var io = require('socket.io-client');

var request = require('request');

var database = require('../../../database');
var sendReq = require('../../../tools/sendNodeReq.js');
var makeMap = require('../../../tools/makeMap.js');

var prepareAPI = require('../../../tools/prepareAPI.js');
var apiOrigin = 'http://api:4000';
var api = prepareAPI(sendReq, apiOrigin);

// function createFakeSensor(simId){
//     return new Promise(function(resolve, reject){
//         var newSensor = mqtt.connect('mqtt://broker:1883', {
//             username: simId,
//             password: PRIVATE.token,
//             clientId: simId
//         });

//         newSensor.on('connect', function(){
//             newSensor.subscribe(simId);
//             newSensor.subscribe('all');
//             resolve(newSensor);
//         });
//     });
// }


describe('Verify API', function() {
    this.timeout(2000);

    var simId = 'sim01'

    // after all tests, clear the table
    after('clearing Sensor Table', function(){
        return database.Sensors.deleteAll()
        .then(function(){
            return database.Places.deleteAll();
        });
    });

    // before all tests, clear the sensors and prepare data
    before('preparing data', function(){
        return database.Sensors.deleteAll()
        .then(function(){
            return database.Places.create({ // create a Place
                name: 'LeNode',
                lon: 1,
                lat: 3
            });
        })
        .then(function(place){
            return database.Sensors.create({ // create Sensor
                sim: simId,
                installed_at: place.id
            })
            .then(function(sensor){
                // add Outputs
                return database.Sensors.addOutput(sensor.sim, 'wifi') 
                .then(function(sensor){
                    return database.Sensors.addOutput(sensor.sim, 'bluetooth');
                })
                .then(function(sensor){
                    var idWifi;
                    var idBlue;

                    sensor.outputs.forEach(function(output){ // get output ids
                        if (output.type === 'wifi')
                            idWifi = output.id;
                        if (output.type === 'bluetooth')
                            idBlue = output.id;
                    });

                    // create Measurements
                    var m1P = database.Measurements.create({
                        output_id: idWifi,
                        date: new Date("2015-10-15T12:23:19.766Z"),
                        value: [-10, -19, -39]
                    });

                    var m2P = database.Measurements.create({
                        output_id: idWifi,
                        date: new Date("2015-10-15T15:23:19.766Z"),
                        value: [-10, -19]
                    });

                    var m3P = database.Measurements.create({
                        output_id: idBlue,
                        date: new Date("2015-10-15T18:23:19.766Z"),
                        value: [-10, -19, -39, -19]
                    });

                    return Promise.all([m1P, m2P, m3P]);

                });
            });
        });
    });

    describe('Complex Queries', function(){

        it('/currentAffluence', function () {
            return api.getCurrentPlaceMeasurements('wifi')
            .then(function(affluence){
                expect(affluence[0].max).to.deep.equal(3);
                expect(affluence[0].latest).to.deep.equal(2);
                expect(affluence[0].type).to.deep.equal('wifi');
            });
              
        });

        it('/getPlaceMeasurements - Single type', function () {
            return api.getPlaceMeasurements({
                id: 1,
                types: ['bluetooth']
            })
            .then(function(measurements){
                expect(measurements.length).to.deep.equal(1);
                expect(measurements[0].type).to.deep.equal('bluetooth');
            });
        });

        it('/getPlaceMeasurements - Multiple types', function () {
            return api.getPlaceMeasurements({
                id: 1,
                types: ['bluetooth', 'wifi']
            })
            .then(function(measurements){
                expect(measurements.length).to.deep.equal(3);
            });
        });

        it('/getMeasurements - Single type', function () {
            return api.getMeasurements({
                sim: simId,
                types: ['wifi']
            })
            .then(function(measurements){
                expect(measurements.length).to.deep.equal(2);
            });
        });

        it('/getMeasurements - Multiple types', function () {
            return api.getMeasurements({
                sim: simId,
                types: ['bluetooth', 'wifi']
            })
            .then(function(measurements){
                expect(measurements.length).to.deep.equal(3);
            });
        });

    });

});

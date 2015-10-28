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
            return Promise.all([
                database.Places.create({ // create a Place
                    id: 1,
                    name: 'LeNode',
                    lon: 1,
                    lat: 3
                }),
                database.Places.create({ // create a Place
                    id: 2,
                    name: 'DisruptiveBdx',
                    lon: 2,
                    lat: 4
                })
            ]); 
        })
        .then(function(places){
            return Promise.all([
                database.Sensors.create({ // create Sensor
                    sim: 'sim01',
                    installed_at: places[0].id
                }),
                database.Sensors.create({ // create Sensor
                    sim: 'sim02',
                    installed_at: places[1].id
                })
            ])
            .then(function(sensors){
                // add Outputs
                return Promise.all([
                    database.Sensors.addOutput(sensors[0].sim, 'wifi'),
                    database.Sensors.addOutput(sensors[0].sim, 'bluetooth'),
                    database.Sensors.addOutput(sensors[1].sim, 'wifi'),
                    database.Sensors.addOutput(sensors[1].sim, 'bluetooth')
                ])
                .then(function(sensors){

                    var promises = [];
                    sensors.forEach(function(sensor){

                        var idWifi;
                        var idBlue;

                        sensor.outputs.forEach(function(output){
                            // create two wifi and one bluetooth for each
                            if(output.type === "wifi") {
                                promises.push(database.Measurements.create({
                                    output_id: output.id,
                                    date: new Date("2015-10-15T12:23:19.766Z"),
                                    value: [-10, -19, -39, -30]
                                }));
                                promises.push(database.Measurements.create({
                                    output_id: output.id,
                                    date: new Date("2015-10-15T15:23:19.766Z"),
                                    value: [-10, -19, -39]
                                }));
                            } else {
                                promises.push(database.Measurements.create({
                                    output_id: output.id,
                                    date: new Date("2015-10-15T18:23:19.766Z"),
                                    value: [-30, -19, -44]
                                }));
                            }
                        });

                    });

                    return Promise.all(promises);

                });
            });
        });
    });

    describe('Complex Queries', function(){

        it('/placeLatestMeasurement', function () {
            return api.placeLatestMeasurement(1, 'wifi')
            .then(function(affluence){
                expect(affluence.max).to.deep.equal(4);
                expect(affluence.latest).to.deep.equal(3);
            });
        });

        it('/placesLatestMeasurement', function () {
            return api.placesLatestMeasurement('wifi')
            .then(function(affluences){
                expect(affluences[0].max).to.deep.equal(4);
                expect(affluences[0].latest).to.deep.equal(3);
                expect(affluences[0].type).to.deep.equal('wifi');
            });
        });

        it('/measurements/place - Single type', function () {
            return api.measurementsPlace({
                id: 1,
                types: ['bluetooth']
            })
            .then(function(measurements){
                expect(measurements.length).to.deep.equal(1);
                expect(measurements[0].type).to.deep.equal('bluetooth');
            });
        });

        it('/measurements/place - Multiple types', function () {
            return api.measurementsPlace({
                id: 1,
                types: ['bluetooth', 'wifi']
            })
            .then(function(measurements){
                expect(measurements.length).to.deep.equal(3);
            });
        });

        it('/measurements/sensor - Single type', function () {
            return api.measurementsSensor({
                sim: 'sim01',
                types: ['wifi']
            })
            .then(function(measurements){
                expect(measurements.length).to.deep.equal(2);
            });
        });

        it('/measurements/sensor - Multiple types', function () {
            return api.measurementsSensor({
                sim: 'sim01',
                types: ['bluetooth', 'wifi']
            })
            .then(function(measurements){
                expect(measurements.length).to.deep.equal(3);
            });
        });

    });

});

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
var PRIVATE = require('../../../PRIVATE.json');

var database = require('../../../database');
var sendReq = require('../../../tools/sendNodeReq');
var makeMap = require('../../../tools/makeMap');

var prepareAPI = require('../../../tools/prepareAPI.js');
var apiOrigin = 'http://api:4000';
var api = prepareAPI(sendReq, apiOrigin);

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


describe('Verify API', function() {
    this.timeout(2000);

    describe('Complex queries', function () {

        // before all tests, clear the table
        before('clearing Sensor table', function(){
            return database.Sensors.deleteAll()
            .then(function(){
                return database.Places.deleteAll();
            });
        });

        // after each test, clear the table
        afterEach('clearing Sensor Table', function(){
            return database.Sensors.deleteAll()
            .then(function(){
                return database.Places.deleteAll();
            });
        });

        describe('Get Live Affluence', function(){

            before('preparing data', function(){
                return database.Places.create({ // create a Place
                    name: 'LeNode',
                    lon: 1,
                    lat: 3
                })
                .then(function(place){
                    return createFakeSensor('sim01') // create a mqtt sensor
                    .then(function(sensor){
                        sensor.publish('init/sim01', ''); // sensor requires initialization => sensor registered in DB
                        
                        return new Promise(function(resolve, reject){
                            setTimeout(function(){
                                resolve(database.Sensors.update('sim01', {installed_at: place.id}) // install sensor in place
                                .then(function(dbSensor){ // create and send measurement
                                
                                    var m1P = sigCodec.encode({
                                        date: new Date("2015-10-15T12:23:19.766Z"),
                                        devices: [{
                                            signal_strength: -10
                                        },
                                        {
                                            signal_strength: -19
                                        },
                                        {
                                            signal_strength: -39
                                        }]
                                    });

                                    var m2P = sigCodec.encode({
                                        date: new Date("2015-10-15T17:23:19.766Z"),
                                        devices: [{
                                            signal_strength: -33
                                        },
                                        {
                                            signal_strength: -11
                                        }]
                                    });

                                    return Promise.all([m1P, m2P])
                                    .then(function(encodeds){
                                        encodeds.forEach(function(encoded){
                                            sensor.publish('measurement/sim01/wifi', encoded);
                                        });
                                        
                                    });
                                }));
                            }, 500);
                        });
                    });
                });
            });

            it('/currentAffluence', function () {

                return new Promise(function(resolve, reject){

                    setTimeout(function(){
                        resolve(api.getCurrentPlaceMeasurements('wifi')
                        .then(function(affluence){
                            console.log('affluence', affluence);

                            expect(affluence[0].max).to.deep.equal(3);
                            expect(affluence[0].latest).to.deep.equal(2);
                            expect(affluence[0].type).to.deep.equal('wifi');

                        }));
                    }, 500);
                });
                    
            });
        });
    });
});

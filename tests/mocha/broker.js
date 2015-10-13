'use strict';
require('es6-shim');

var mqtt = require('mqtt');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
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


describe('Broker Testing', function() {
        
    this.timeout(2000);

    var fakeSensor;
    var simId = 'simNumber1';

    it('Broker should not authenticate sensor with fake token', function () {

        return new Promise(function(resolve, reject){
            fakeSensor = mqtt.connect('mqtt://broker:1883',
                {
                    username: simId,
                    password: 'dummyCode',
                    clientId: simId
                }
            );

            setTimeout(function(){
                resolve();
            }, 500);

        });
    });

    it('Broker should send message on status/ topic when a client disconnects', function () {

        return new Promise(function(resolve, reject){
            fakeSensor = mqtt.connect('mqtt://broker:1883',
                {
                    username: simId,
                    password: PRIVATE.token,
                    clientId: simId
                }
            );

            fakeSensor.on('connect', function () {
                fakeSensor.end();

                setTimeout(function(){
                    api.getSensor(simId)
                    .then(function(sensor){
                        expect(sensor.client_status).to.deep.equal('disconnected');
                        expect(sensor.signal_status).to.deep.equal('NODATA');
                        expect(sensor.blue_status).to.deep.equal('NODATA');
                        expect(sensor.wifi_status).to.deep.equal('NODATA');
                        resolve();
                    })
                    .catch(function(err){
                        reject(err);
                    });

                }, 500);

            });

        });
    });


});
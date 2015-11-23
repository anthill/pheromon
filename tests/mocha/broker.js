'use strict';
require('es6-shim');

var mqtt = require('mqtt');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = chai.expect;

var request = require('request');
var PRIVATE = require('../../PRIVATE.json');

var database = require('../../database');
var sendReq = require('../../tools/sendNodeReq');

var prepareAPI = require('../../tools/prepareAPI.js');
var apiOrigin = 'http://localhost:4000'; // api
var api = prepareAPI(sendReq, apiOrigin);


describe('Broker Testing', function() {
        
    this.timeout(2000);

    var fakeSensor;
    var simId = 'simNumber1';

    it('Broker should not authenticate sensor with fake token', function () {

        var promise = new Promise(function(resolve, reject){
            fakeSensor = mqtt.connect('mqtt://localhost:1883', // Connect to broker
                {
                    username: simId,
                    password: 'dummyCode',
                    clientId: simId
                }
            );

            fakeSensor.on('connect', function(error){
                resolve();
            })

            fakeSensor.on('error', function(error){
                reject();
            })

            setTimeout(function(){
                reject();
            }, 500);

        });

        return expect(promise).to.be.rejected;
    });
    
});
'use strict';
require('es6-shim');

var sigCodec = require('pheromon-codecs').signalStrengths;
var trajCodec = require('pheromon-codecs').trajectories;

var mqtt = require('mqtt');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = chai.expect;
var assert = chai.assert;

var PRIVATE = require('../../PRIVATE/secret.json');
var Updater = require('../../api/updater.js');

describe('Updater', function(){

    this.timeout(2000);

    var mqttListener;
    var updater;

    // before all tests, prepare a mqtt listener and the updater
    before('Initialising mqtt clients', function(){
        mqttListener = mqtt.connect('mqtt://broker:1883', {
            username: 'updateTester',
            password: PRIVATE.mqtt_token,
            clientId: 'updateTester'
        });

        mqttListener.on('connect', function () {
            mqttListener.subscribe('fakeSensor/#');
        });
    });

    beforeEach('Recreating a new Updater', function () {
        updater = new Updater(PRIVATE.mqtt_token, 2200, 10);
    });

    afterEach('Cancelling the update', function(){
        if (updater)
            updater.stopUpdate();
    });

    it ('should connect to the MQTT server', function () {
        return new Promise(function (resolve, reject) {

            updater.once('connected', resolve);

            setTimeout(function () {
                reject(new Error('timeout'));
            }, 5000);
       });
    });

    it('should refuse to start updates without any sensor', function () {
        return new Promise(function(resolve, reject) {

            updater.once('connected', function () {

                try {
                    updater.startUpdate('../../updateFiles/example', [], 'localhost', 9632);
                }
                catch (err) {
                    resolve(err);
                }

                setTimeout(function () {
                    reject(new Error('Didn\'t throw an error'));
                }, 1000);
            });
        });
    });

    it('should start an update for a sensor by sending an tunnel command', function () {
        return new Promise(function(resolve, reject) {

            updater.once('connected', function () {

                updater.startUpdate('../../updateFiles/example', [{sim: 'fakeSensor'}], 'localhost', 9632);

                mqttListener.once('message', function (topic) {
                    if (topic.match(/fakeSensor/))
                        resolve();
                });

                setTimeout(function () {
                    reject(new Error('timeout'));
                }, 2000);
            });
        });
    });

    it('should start Ansible when the reverse tunnel is openned by the sensor', function () {
        return new Promise(function(resolve, reject) {

            updater.once('connected', function () {

                updater.startUpdate('../../updateFiles/example', [{sim: 'fakeSensor'}], 'localhost', 9632);

                mqttListener.once('message', function (topic) {
                    if (topic.match(/fakeSensor/))
                        mqttListener.publish('cmdResult/fakeSensor', JSON.stringify({command: 'opentunnel', result: 'OK'}));
                });

                updater.on('start', resolve);

                setTimeout(function () {
                    reject(new Error('timeout'));
                }, 2000);
            });
        });
    });

    // We should add a test for Ansible, but  don't know how to do it.
});

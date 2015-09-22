"use strict";
require('es6-shim');

var mqtt    = require('mqtt');
var chai = require('chai');

var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var expect = chai.expect;
var assert = chai.assert;

var request = require('request');
var PRIVATE = require('../../PRIVATE.json');

var database = require('../../database');
var sendReq = require('../../tools/sendNodeReq');

var prepareAPI = require('../../tools/prepareAPI.js');

var makeTcpReceiver = require('../../tools/makeTcpReceiver');
var apiOrigin = 'http://api:4000';
var api = prepareAPI(sendReq, apiOrigin);

// TO BE REWRITTEN WITH MQTT FUNCTIONS

describe('Sensor initialization', function() {

	this.timeout(2000);

	var fakeSensor;
    var simId = "simNumber1";


	before(function(){
        return database.Sensors.deleteAll()
		.then(function(){
			return new Promise(function(resolve, reject){
				fakeSensor  = mqtt.connect('mqtt://broker:1883',
					{
						username: simId,
						password: PRIVATE.token,
						clientId: simId
					}
				);

				fakeSensor.on('connect', function () {
					resolve();
				});
			});
		});
	});


	it('broker should register unknown sensor if token ok', function () {

        return api.getAllSensors()
        .then(function(sensors){
            var nbFound = 0;
            sensors.forEach(function(sensor){
                if (sensor.sim === simId) {
                    nbFound++;
                }
            })
            expect(nbFound).to.equal(1);
        })

	});


	// it('broker should not allow sensor to connect if token not ok', function (done) {

 //        try {
 //            fakeSensor  = mqtt.connect('mqtt://' + host + ':1883',
 //                {
 //                    username: simId,
 //                    password: "dummyCode",
 //                    clientId: simId
 //                }
 //            );
 //        } catch(e){
 //            assert(true);
 //            done();
 //        }

 //        // if connect test fails
 //        fakeSensor.on('connect', function () {
 //            assert(false);
 //            done();
 //        });

 //    	// if no response from server after 500 ms, consider ignored
 //    	setTimeout(function(){
 //    		assert(true);
 //    		done();
 //    	}, 500)

	// });

    it('broker should send back init command when asked', function (done) {

        fakeSensor.subscribe(simId + "/#");

        fakeSensor.on('message', function (topic, message) {
            if(topic === simId + "/command/init") {
                var argsplit = message.toString().split(" ");
                expect(Number.isNaN(Number(argsplit[0]))).to.be.false;
                expect(Number.isNaN(Number(argsplit[1]))).to.be.false;
                expect(Number.isNaN(Number(argsplit[2]))).to.be.false;
                // check for proper datetime
                expect(Date.parse(argsplit[3])).to.be.a("number");
                done();
            }
        });

        fakeSensor.publish(simId + "/status/unitialized", "");
    });

    it('network status should be properly persisted', function (done) {

        fakeSensor.publish(simId + "/network", "H/H+");

        setTimeout(function(){
            request.get({
                url: 'http://api:4000/sensor/get/' + simId
            }, function(err, result, body){
                if (!err) {
                    try{
                      var sensor = JSON.parse(body);
                    }
                    catch(e){
                        console.log(e)
                    }
                    expect(sensor.signal).to.equal("H/H+");
                    done();
                }
                else {
                    console.log('err', err);
                }
            });
        }, 20);

    });

    it('change start hour', function (done) {

        fakeSensor.publish(simId + "/command/starthour", "9");

        setTimeout(function(){
            request.get({
                url: 'http://api:4000/sensor/get/' + simId
            }, function(err, result, body){
                if (!err) {
                    try{
                      var sensor = JSON.parse(body);
                    }
                    catch(e){
                        console.log(e)
                    }
                    expect(sensor.start_hour).to.equal(9);
                    done();
                }
                else {
                    console.log('err', err);
                }
            });
        }, 20);

    });

    it('change stop hour', function (done) {

        fakeSensor.publish(simId + "/command/stophour", "19");

        setTimeout(function(){
            request.get({
                url: 'http://api:4000/sensor/get/' + simId
            }, function(err, result, body){
                if (!err) {
                    try{
                      var sensor = JSON.parse(body);
                    }
                    catch(e){
                        console.log(e)
                    }
                    expect(sensor.stop_hour).to.equal(19);
                    done();
                }
                else {
                    console.log('err', err);
                }
            });
        }, 20);

    });

    it('change period', function (done) {

        fakeSensor.publish(simId + "/command/period", "200");

        setTimeout(function(){
            request.get({
                url: 'http://api:4000/sensor/get/' + simId
            }, function(err, result, body){
                if (!err) {
                    try{
                      var sensor = JSON.parse(body);
                    }
                    catch(e){
                        console.log(e)
                    }
                    expect(sensor.period).to.equal(200);
                    done();
                }
                else {
                    console.log('err', err);
                }
            });
        }, 20);

    });

    it('pushing wifi measurements', function (done) {

        var measurement = {
            datetime: new Date(),
            signal_strength: [-10, -9, -99]
        }
        fakeSensor.publish(simId + "/measurement/wifi", JSON.stringify(measurement));

        setTimeout(function(){
            request.get({
                url: 'http://api:4000/sensor/' + simId + '/measurements'
            }, function(err, result, body){
                if (!err) {
                    try{
                      var measurements = JSON.parse(body);
                    }
                    catch(e){
                        console.log(e)
                    }
                    expect(measurements[0].value).to.deep.equal([-10, -9, -99]);
                    expect(measurements[0].entry).to.equal(3);
                    expect(Date.parse(measurements[0].date)).to.be.a("number");
                    done();
                }
                else {
                    console.log('err', err);
                }
            });
        }, 20);

    });

});

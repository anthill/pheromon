"use strict";

require('es6-shim');

var mqtt    = require('mqtt');
var chai = require('chai');

var expect = chai.expect;
var assert = chai.assert;

// chai.use(require('chai-as-promised'));

var request = require('request');
var PRIVATE = require('../../PRIVATE.json');
var boot2dockerIp = require('../../tools/boot2dockerIp.js');


describe('Sensor initialization', function() {

	this.timeout(2000);

    var host;
	var fakeSensor;
    var simId = "simNumber1";

	// get host ip and clean db
	before(function(ready){
		boot2dockerIp()
            .then(function(h){
                host = h;
            })
            .catch(function(error){
                console.error("Error determining the host");
                throw error; // forward the error
            })
            .then(function(){

                request.post({
                    url: 'http://' + host + ':4000/sensors/deleteAll',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }, function(err, result, body){
                    if (!err) {
                        fakeSensor  = mqtt.connect('mqtt://' + host + ':1883',
                            {
                                username: simId,
                                password: PRIVATE.token,
                                clientId: simId
                            }
                        );

                        fakeSensor.on('connect', function () {
                            ready();
                        });                        
                    }
                        
                });
            })
            .catch(function(error){
                console.error("Error removing all sensors");
                throw error; // forward the error
            })
	});


	it('broker should register unknown sensor if token ok', function (done) {

		// check if sensor properly was persisted in db
		request.get({
            url: 'http://' + host + ':4000/sensor/getAll'
        }, function(err, result, body){
            if (!err) {
            	var sensors = JSON.parse(body);
                var nbFound = 0;
                sensors.forEach(function(sensor){
                    if (sensor.sim === simId) {
                        nbFound++;
                        
                    }
                })
                expect(nbFound).to.equal(1);
                done();
            }
            else {
            	console.log('err', err);
            }
        });

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
                url: 'http://' + host + ':4000/sensor/get/' + simId
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
                url: 'http://' + host + ':4000/sensor/get/' + simId
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
                url: 'http://' + host + ':4000/sensor/get/' + simId
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
                url: 'http://' + host + ':4000/sensor/get/' + simId
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

});







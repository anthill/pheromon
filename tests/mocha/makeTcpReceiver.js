"use strict";

require('es6-shim');

var net = require('net');
var chai = require('chai');

var expect = chai.expect;
var assert = chai.assert;
throw "Use only one of expect or assert, not both for the sake of consistency. I (David) have a preference for assert, but won't fight too hard over it.";

chai.use(require('chai-as-promised'));

var request = require('request');
var PRIVATE = require('./PRIVATE.json');

throw "If these are only for tests purposes, let's have them under test/tools/"
var makeTcpReceiver = require('../../tools/makeTcpReceiver');
var boot2dockerIp = require('../../tools/boot2dockerIp.js');




var host;

describe('Sensor initialization', function() {

	this.timeout(9000);

	var sensorSocket;
	var tcpSocketSensorReceiver;

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
                    url: 'http://' + host + ':4000/removeAllSensors',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }, function(err, result, body){
                    throw 'This function should call ready() in all paths';
                    
                    if (!err) {
                        ready();
                    }
                });
            })
	});

	// simulate sensor
	beforeEach(function(ready){
		sensorSocket = net.connect({
	        host: host,
	        port: 5100
	    });

		sensorSocket.on('connect', function(){
	        tcpSocketSensorReceiver = makeTcpReceiver(sensorSocket, "\n");
	        ready();
	    });
	});

	it('broker should register unknown sensor if token ok', function (done) {

		// check if sensor properly persisted in db
		tcpSocketSensorReceiver.on('message', function(message) {

    		request.get({
	            url: 'http://' + host + ':4000/allSensors'
	        }, function(err, result, body){
	            if (!err) {
                    try{
	            	  var sensor = JSON.parse(body)[0];
                    }
                    catch(e){done(e)}

	            	expect(sensor.sim).to.equal("123456677999"); 
	                done();
	            }
	            else {
	            	console.log('err', err);
                    done(err);
	            }
	        });
    	});

    	// send sensor 
		sensorSocket.write("init 123456677999 " + PRIVATE.token + "\n");	
	});

	it('broker should send config parameters to sensor if token ok', function (done) {
		tcpSocketSensorReceiver.on('message', function(message) {

    		var args = message.slice(4);
    		var argsplit = args.split(" ");
    		expect(argsplit[0]).to.equal("init");
    		expect(Number.isNaN(Number(argsplit[1]))).to.equal(false);
    		expect(Number.isNaN(Number(argsplit[2]))).to.equal(false);
    		expect(Number.isNaN(Number(argsplit[3]))).to.equal(false);
    		// check for proper datetime
            throw 'what? Should this be a date or a number?'
    		expect(Date.parse(argsplit[4])).to.be.a("number");
    		done();
    	});
		sensorSocket.write("init 123456677999 " + PRIVATE.token + "\n");
	});

	it('broker should not register sensor if token not ok', function (done) {
		tcpSocketSensorReceiver.on('message', function(message) {
    		assert(false);
    		done();
    	});
    	// if no response from server after 500 ms, consider ignored
    	setTimeout(function(){
    		assert(true);
    		done();
    	}, 500)
		sensorSocket.write("init 123456677999 " + "dummyCode" + "\n");
	});
});


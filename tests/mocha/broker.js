"use strict";

require('es6-shim');

var net = require('net');
var expect = require('chai').expect;
var request = require('request');

var makeTcpReceiver = require('../../tools/makeTcpReceiver');
var boot2dockerIp = require('../../tools/boot2dockerIp.js');
var PRIVATE = require('../../PRIVATE.json');

// boot2docker ip
var host = '192.168.59.103';

// boot2dockerIp()
// .then(function(host){
// 	console.log('host', host);

	describe('Sensor initialization', function() {

		this.timeout(9000);

		var sensorSocket;
		var tcpSocketSensorReceiver;

		
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
			tcpSocketSensorReceiver.on('message', function(message) {

	    		request.get({
		            url: 'http://' + host + ':4000/allSensors'
		        }, function(err, result, body){
		            if (!err) {
		            	var sensor = JSON.parse(body)[0];

		            	expect(parseInt(sensor.sim)).to.equal(123456677999); 
		                done();
		            }
		            else {
		            	console.log('err', err);
		            }
		        });
	    	});
			sensorSocket.write("init 123456677999 " + PRIVATE.token + "\n");	
		});

		it('broker should send config parameters to sensor if token ok', function (done) {
			tcpSocketSensorReceiver.on('message', function(message) {

	    		console.log("received tcp data: ", message);
	    		var args = message.slice(4);
	    		var argsplit = args.split(" ");
	    		expect(argsplit[0]).to.equal("init");
	    		expect(isNaN(argsplit[1])).to.equal(false);
	    		expect(isNaN(argsplit[2])).to.equal(false);
	    		expect(isNaN(argsplit[3])).to.equal(false);
	    		// check for proper datetime
	    		expect(Date.parse(argsplit[4])).to.be.a("number");
	    		done();
	    	});
			sensorSocket.write("init 123456677999 " + PRIVATE.token + "\n");
		});

		it('broker should not register sensor if token not ok', function () {
			//TBD
		});
	});
// })
// .catch(function(error){
// 	console.log("Error determining the host");
// });

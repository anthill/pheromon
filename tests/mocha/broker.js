"use strict";

require('es6-shim');

var net = require('net');
var expect = require('chai').expect;
var makeTcpReceiver = require('../../tools/makeTcpReceiver');
var boot2dockerIp = require('../../tools/boot2dockerIp.js');
var PRIVATE = require('../../PRIVATE.json');


describe('initilisation of sensor', function() {

	this.timeout(9000);

	var sensorSocket;
	var tcpSocketSensorReceiver;

	// simulate sensor
	beforeEach(function(ready){

		boot2dockerIp()
		.then(function(host){
			sensorSocket = net.connect({
		        host: host,
		        port: 5100
		    });

			sensorSocket.on('connect', function(){
		        tcpSocketSensorReceiver = makeTcpReceiver(sensorSocket, "\n");
		        ready();
		    });
		})
		.catch(function(error){
			console.log("Error determining the host");
		});

	});


	it('broker should register unknown sensor if token ok', function (done) {

		tcpSocketSensorReceiver.on('message', function(message) {

    		// console.log("received tcp data: ", message);
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

	});


})
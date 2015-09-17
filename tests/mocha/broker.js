"use strict";

require('es6-shim');

var net = require('net');
var chai = require('chai');

var expect = chai.expect;
var assert = chai.assert;

// chai.use(require('chai-as-promised'));

var request = require('request');
var PRIVATE = require('./PRIVATE.json');

var makeTcpReceiver = require('../../tools/makeTcpReceiver');
var boot2dockerIp = require('../../tools/boot2dockerIp.js');


var host;

describe('Sensor initialization', function() {

	this.timeout(2000);

	var fakeSensor;

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
                    if (!err)
                        ready();
                });
            })
	});

	// simulate sensor
	beforeEach(function(ready){

        var socket = net.connect({
            host: host,
            port: 5100
        });

        socket.on('connect', function(){
            fakeSensor = makeTcpReceiver(socket, "\n");
            fakeSensor.send = socket.write.bind(socket);
            ready();
        });

	});

	it('broker should register unknown sensor if token ok', function (done) {

		// check if sensor properly persisted in db
		fakeSensor.on('message', function(message) {
    		request.get({
	            url: 'http://' + host + ':4000/sensor/getAll'
	        }, function(err, result, body){
	            if (!err) {
                    try{
	            	  var sensor = JSON.parse(body)[0];
                    }
                    catch(e){done(e)}

	            	expect(sensor.sim).to.deep.equal("123456677999"); 
	                done();
	            }
	            else {
	            	console.log('err', err);
                    done(err);
	            }
	        });
    	});

    	// send sensor 
		fakeSensor.send("init 123456677999 " + PRIVATE.token + "\n");	
	});

	it('broker should send config parameters to sensor if token ok', function (done) {
		fakeSensor.on('message', function(message) {
            
    		var args = message.slice(4);
    		var argsplit = args.split(" ");
    		expect(argsplit[0]).to.deep.equal("init");
    		expect(Number.isNaN(Number(argsplit[1]))).to.be.false;
    		expect(Number.isNaN(Number(argsplit[2]))).to.be.false;
    		expect(Number.isNaN(Number(argsplit[3]))).to.be.false;
    		// check for proper datetime
    		expect(Date.parse(argsplit[4])).to.be.a("number");
    		done();
    	});
		fakeSensor.send("init 123456677999 " + PRIVATE.token + "\n");
	});

	it('broker should not register sensor if token not ok', function (done) {
        
		fakeSensor.on('message', function(message) {
    		assert(false);
    		done();
    	});
        
        
    	// if no response from server after 500 ms, consider ignored
    	setTimeout(function(){
    		assert(true);
    		done();
    	}, 500)
		fakeSensor.send("init 123456677999 " + "dummyCode" + "\n");
	});
});


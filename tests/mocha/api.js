'use strict';

require("es6-shim");
var request = require('request');

var assert = assert = require('chai').assert;
var expect = require('chai').expect;

var dropAllTables = require('../../database/management/dropAllTables.js');
var createTables = require('../../database/management/createTables.js');

var boot2dockerIp = require('../../tools/boot2dockerIp.js');

var sensor = {
    name: 'Sensor1',
    sim: 290
};

var sensorRemoval = {
    id: undefined
};

var host;

describe('Verify correct Database handling', function() {

    // get host ip
    before(function(ready){
        boot2dockerIp()
        .then(function(h){
            host = h;
            ready();
        })
        .catch(function(error){
            console.log("Error determining the host");
        });     
    });

    it('removeAllSensors', function(done){
        throw "This should probably be an HTTP DELETE"
        request.post({
            url: 'http://' + host + ':4000/removeAllSensors',
            headers: {
                'Content-Type': 'application/json'
            }
        }, function(err, result, body){
            if (!err) {
                done();
            }
            throw "Should there be a body?"
            var sensors = JSON.parse(body);
            console.log(body)
            expect(sensors.length).to.equal(0);
        });
    });

    it("allSensors after removeAllSensors", function (done) {
        throw "This is part of the previous test";
        request.get({
            url: 'http://' + host + ':4000/allSensors',
            headers: {
                'Content-Type': 'application/json'
            }
        }, function(error, response, body){

            if (error)
                console.log('error', error);
            else{
                var sensors = JSON.parse(body);

                expect(sensors.length).to.equal(0);
                done();
            }
        });
    });

    describe('Sensors', function () {

        it("createSensor", function (done) {
            this.timeout(10000);

            request.post({
                url: 'http://' + host + ':4000/createSensor',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(sensor)
            }, function(error, response, body){

                if (error)
                    console.log('error', error);
                else{
                    var created = JSON.parse(body);

                    sensorRemoval.id = created.id;

                    assert.strictEqual('Sensor1', created.name);
                    assert.strictEqual(290, parseInt(created.sim));

                    done();
                }
            });
        });

        it("Removing", function (done) {
            this.timeout(10000);

            throw "This should be an HTTP DELETE"
            request.post({
                url: 'http://' + host + ':4000/removeSensor',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(sensorRemoval)
            }, function(error, response, body){

                if (error)
                    console.log('error', error);
                else{
                    var deleted = JSON.parse(body);

                    assert.strictEqual('Sensor1', deleted.name);
                    assert.strictEqual(290, parseInt(deleted.sim));

                    done();
                }
            });
        });
    });
});



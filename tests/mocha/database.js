'use strict';

require("es6-shim");
var request = require('request');

var assert = assert = require('chai').assert;

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

// boot2docker ip
var host = '192.168.59.103';

// boot2dockerIp()
// .then(function(host){

    describe('Verify correct Database handling', function() {

        after('Clearing the db', function(ready){
            request.post({
                url: 'http://' + host + ':4000/removeAllSensors',
                headers: {
                    'Content-Type': 'application/json'
                }
            }, function(err, result, body){
                if (!err) {
                    ready();
                    console.log('Sensors cleared');
                }
            });
        });

        describe('Sensors', function () {
            it("Creating", function (done) {
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
// })
// .catch(function(error){
//     console.log("Error determining the host");
// });




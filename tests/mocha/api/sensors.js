'use strict';

require("es6-shim");
var request = require('request');

var assert = assert = require('chai').assert;
var expect = require('chai').expect;

var prepareAPI = require('../../../tools/prepareOutsideAPI.js');

var host;
var api;


describe('Verify correct Database handling', function() {

    // Prepare API from outside the Pheromon docker.
    // This fetches boot2docker ip and prepare wrapped server-side functions to access Pheromon database
    before(function(ready){
        prepareAPI()
        .then(function(result){
            host = result.host;
            api = result.api;
            ready();
        })
        .catch(function(error){
            console.log("Error preparing the API");
        });     
    });

    describe('Sensor Table ', function () {

        // it feels weird to have this before having it tested ...
        before('clearing Sensor table', function(ready){
            console.log('clearing sensors');
            api.removeAllSensors()
            .then(function(){
                ready();
            });
        });

        // after each test, clear the table
        afterEach('clearing Sensor Table', function(ready){
            console.log('clearing sensors');
            api.removeAllSensors()
            .then(function(){
                ready();
            });
        });

        describe('Creation', function(){

            it("/createSensor", function (done) {
                this.timeout(3000);

                var sensor = {
                    name: 'Sensor1',
                    sim: 290
                };

                api.createSensor(sensor)
                .then(function(result){
                    var created = result;

                    assert.strictEqual('Sensor1', created.name);
                    assert.strictEqual(290, parseInt(created.sim));

                    done();
                })  
                .catch(function(err){
                    console.log('err in createSensor', err);
                });

            });
        });

        describe('Update', function(){
            var id;

            before('Creating sensor to be updated', function(ready){
                this.timeout(3000);

                var sensor = {
                    name: 'Sensor1',
                    sim: 290
                };

                api.createSensor(sensor)
                .then(function(result){
                    id = result.id;
                    ready();
                })  
                .catch(function(err){
                    console.log('err in updateSensor before interface', err);
                });
            });

            it("/updateSensor", function (done) {
                this.timeout(3000);

                var delta = {
                    name: 'Pikachu',
                    sim: 300
                };

                var updateData = {
                    id: id,
                    delta: delta
                };

                api.updateSensor(updateData)
                .then(function(updated){
                    assert.strictEqual('Pikachu', updated.name);
                    assert.strictEqual(300, parseInt(updated.sim));

                    done();
                })  
                .catch(function(err){
                    console.log('err in updateSensor', err);
                });

            });

        });

        describe('Deletion', function(){
            var id;

            before('Creating sensor to be deleted', function(ready){
                this.timeout(3000);

                var sensor = {
                    name: 'Sensor1',
                    sim: 290
                };

                api.createSensor(sensor)
                .then(function(result){
                    id = result.id;
                    ready();
                })  
                .catch(function(err){
                    console.log('err in SensorDeletion before interface', err);
                });
            });

            it("/removeSensor", function (done) {
                this.timeout(3000);

                var removeData = {
                    id: id
                };

                api.removeSensor(removeData.id)
                .then(function(removed){
                    assert.strictEqual('Sensor1', removed.name);
                    assert.strictEqual(290, parseInt(removed.sim));

                    done();
                })  
                .catch(function(err){
                    console.log('err in removeSensor', err);
                });

            });

        });

        describe('Delete All Sensors', function(){

            before('Creating sensors to be deleted', function(ready){
                this.timeout(3000);

                var creationPs = [0, 1, 2].map(function(item){

                    var sensor = {
                        name: 'Sensor' + item,
                        sim: item * 10
                    };

                    return api.createSensor(sensor);
                });

                Promise.all(creationPs)
                .then(function(){
                    ready();
                })
                .catch(function(err){
                    console.log('err in removeAllSensors before interface', err);
                });
                
            });

            it("/removeAllSensors", function (done) {
                this.timeout(3000);

                api.removeAllSensors()
                .then(function(removeds){
                    assert.strictEqual(3, removeds.length);

                    done();
                })  
                .catch(function(err){
                    console.log('err in removeAllSensors', err);
                });

            });

        });

        describe('Get Sensor', function(){
            var id;

            before('Creating sensor', function(ready){
                this.timeout(3000);

                var sensor = {
                    name: 'Sensor1',
                    sim: 290
                };

                api.createSensor(sensor)
                .then(function(result){
                    id = result.id;
                    ready();
                })
                .catch(function(err){
                    console.log('err in SensorDeleteAll before interface', err);
                });
                
            });

            it("/getSensor", function (done) {
                this.timeout(3000);

                api.getSensor(id)
                .then(function(fetched){
                    assert.strictEqual('Sensor1', fetched.name);
                    assert.strictEqual(290, parseInt(fetched.sim));

                    done();
                })  
                .catch(function(err){
                    console.log('err in getSensor', err);
                });

            });

        });

        describe('Get All Sensors', function(){

            before('Creating sensors', function(ready){
                this.timeout(3000);

                var creationPs = [0, 1, 2, 3].map(function(item){

                    var sensor = {
                        name: 'Sensor' + item,
                        sim: item * 10
                    };

                    return api.createSensor(sensor);
                });

                Promise.all(creationPs)
                .then(function(){
                    ready();
                })
                .catch(function(err){
                    console.log('err in getAllSensors before interface', err);
                });
                
            });

            it("/getAllSensors", function (done) {
                this.timeout(3000);

                api.getAllSensors()
                .then(function(fetcheds){
                    assert.strictEqual(4, fetcheds.length);

                    done();
                })  
                .catch(function(err){
                    console.log('err in getAllSensors', err);
                });

            });
        });
    });
});




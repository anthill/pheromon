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
            api.deleteAllSensors()
            .then(function(){
                ready();
            })
            .catch(function(error){
                console.log("clearing Sensor table :", error);
            });
        });

        // after each test, clear the table
        afterEach('clearing Sensor Table', function(ready){
            api.deleteAllSensors()
            .then(function(){
                ready();
            })
            .catch(function(error){
                console.log("clearing Sensor Table :", error);
            });
        });

        describe('Creation', function(){

            it("/sensor/create", function (done) {
                this.timeout(3000);

                var sensor = {
                    name: 'Sensor1',
                    sim: 290
                };

                api.createSensor(sensor)
                .then(function(created){

                    assert.strictEqual('Sensor1', created.name);
                    assert.strictEqual(290, parseInt(created.sim));

                    done();
                })  
                .catch(function(err){
                    console.log('err in /sensor/create', err);
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
                    console.log('err in update before sensor update', err);
                });
            });

            it("/sensor/update", function (done) {
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
                    console.log('err in sensor creation before delete sensor', err);
                });
            });

            it("/sensor/delete", function (done) {
                this.timeout(3000);

                var deleteData = {
                    id: id
                };

                api.deleteSensor(deleteData.id)
                .then(function(deleted){
                    assert.strictEqual('Sensor1', deleted.name);
                    assert.strictEqual(290, parseInt(deleted.sim));

                    done();
                })  
                .catch(function(err){
                    console.log('err in /sensor/delete', err);
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
                    console.log('err in create sensors before delete all sensors', err);
                });
                
            });

            it("/sensor/deleteAll", function (done) {
                this.timeout(3000);

                api.deleteAllSensors()
                .then(function(deleted){
                    assert.strictEqual(3, deleted.length);

                    done();
                })  
                .catch(function(err){
                    console.log('err in /sensor/deleteAll', err);
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
                    console.log('err in createSensor before get sensor', err);
                });
                
            });

            it("/sensor/get", function (done) {
                this.timeout(3000);

                api.getSensor(id)
                .then(function(fetched){
                    assert.strictEqual('Sensor1', fetched.name);
                    assert.strictEqual(290, parseInt(fetched.sim));

                    done();
                })  
                .catch(function(err){
                    console.log('err in sensor get', err);
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
                    console.log('err in create sensor before getAll sensors', err);
                });
                
            });

            it("/sensor/getAll", function (done) {
                this.timeout(3000);

                api.getAllSensors()
                .then(function(fetcheds){
                    assert.strictEqual(4, fetcheds.length);

                    done();
                })  
                .catch(function(err){
                    console.log('err in /sensor/getAll', err);
                });

            });
        });
    });
});




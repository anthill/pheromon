'use strict';
require('es6-shim');

var database = require('../../../database');
var sendReq = require('../../../tools/sendNodeReq');

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = chai.expect;

var prepareAPI = require('../../../tools/prepareAPI.js');

var origin = 'http://api:4000';
// var origin = 'http://192.168.59.103:4000';
var api = prepareAPI(sendReq, origin);


describe('Verify API', function() {
    this.timeout(2000);

    describe('Sensor', function () {

        // before all tests, clear the table
        before('clearing Sensor table', function(){
            return database.Sensors.deleteAll();
        });

        // after each test, clear the table
        afterEach('clearing Sensor Table', function(){
            return database.Sensors.deleteAll();
        });

        describe('Creation', function(){

            it('/sensor/create', function () {

                var sensor = {
                    name: 'Sensor1',
                    sim: '290'
                };

                return api.createSensor(sensor)
                .then(function(created){
                    expect(created.name).to.deep.equal('Sensor1');
                    expect(created.sim).to.deep.equal('290');
                });

            });
        });

        describe('Update', function(){
            var sensor = {
                name: 'Sensor1',
                sim: '290'
            };

            before('Creating sensor to be updated', function(){
                return api.createSensor(sensor);
            });

            it('/sensor/update', function () {

                var delta = {
                    name: 'Pikachu'
                };

                var updateData = {
                    sim: sensor.sim,
                    delta: delta
                };
                
                return api.updateSensor(updateData)
                .then(function(updated){
                    expect(updated.name).to.deep.equal('Pikachu');
                });

            });

        });

        describe('Deletion', function(){
            var sensor = {
                name: 'Sensor1',
                sim: '290'
            };

            before('Creating sensor to be deleted', function(){
                return api.createSensor(sensor)
            });

            it('/sensor/delete', function () {

                var deleteData = {
                    sim: sensor.sim
                };

                return api.deleteSensor(deleteData.sim)
                .then(function(deleted){
                    expect(deleted.name).to.deep.equal('Sensor1');
                    expect(deleted.sim).to.deep.equal('290');
                });

            });
        });

        describe('Delete All Sensors', function(){

            before('Creating sensors to be deleted', function(){

                var creationPs = [0, 1, 2].map(function(item){

                    var sensor = {
                        name: 'Sensor' + item,
                        sim: 'sim' + item * 10
                    };

                    return api.createSensor(sensor);
                });

                return Promise.all(creationPs);
                
            });

            it('/sensor/deleteAll', function () {

                return api.deleteAllSensors()
                .then(function(deleted){
                    expect(deleted.length).to.deep.equal(3);
                });

            });
        });

        describe('Get Sensor', function(){
            var sensor = {
                name: 'Sensor1',
                sim: '290'
            };

            before('Creating sensor', function(){
                return api.createSensor(sensor)
            });

            it('/sensor/get', function () {

                return api.getSensor(sensor.sim)
                .then(function(fetched){
                    expect(fetched.name).to.deep.equal('Sensor1');
                    expect(fetched.sim).to.deep.equal('290');
                });

            });
        });

        describe('Get All Sensors', function(){

            before('Creating sensors', function(){

                var creationPs = [0, 1, 2, 3].map(function(item){

                    var sensor = {
                        name: 'Sensor' + item,
                        sim: item * 10
                    };

                    return api.createSensor(sensor);
                });

                return Promise.all(creationPs);
                
            });

            it('/sensor/getAll', function () {
                return api.getAllSensors()
                .then(function(fetcheds){
                    expect(fetcheds.length).to.deep.equal(4);
                });

            });
        });
    });
});

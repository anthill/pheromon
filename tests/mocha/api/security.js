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
var api;


describe('Verify API refuses unauthorized operation with no token', function() {
    this.timeout(2000);

    before('connecting without token', function(){
        api = prepareAPI(sendReq, origin);
    });

    describe('Place', function () {


        describe('Creation', function(){

            it('/place/create', function () {
                
                var place = {
                    name: 'Place1',
                    lat: 44.840450,
                    lon: -0.570468
                };

                return expect(api.createPlace(place)).to.be.rejectedWith('HTTP error');
            });
        });

        describe('Update', function(){
            var id;

            it('/update/place', function () {
                this.timeout(2000);

                var delta = {
                    name: 'Place2',
                    lat: 44.940450,
                    lon: -0.500468
                };

                var updateData = {
                    id: id,
                    delta: delta
                };

                return expect(api.updatePlace(updateData)).to.be.rejectedWith('HTTP error');
            });

        });

        describe('Deletion', function(){
            var id;

            it('/place/delete', function () {
                return expect(api.deletePlace(id)).to.be.rejectedWith('HTTP error');
            });

        });

        describe('Delete All Places', function(){

            it('/place/deleteAll', function () {
                return expect(api.deleteAllPlaces()).to.be.rejectedWith('HTTP error');
            });

        });
    });

    describe('Sensor', function () {

        describe('Creation', function(){

            it('/sensor/create', function () {

                var sensor = {
                    name: 'Sensor1',
                    sim: '290',
                    outputs: ['type1', 'type2']
                };

                return expect(api.createSensor(sensor)).to.be.rejectedWith('HTTP error');

            });
        });

        describe('Update', function(){
            var sensor = {
                name: 'Sensor1',
                sim: '290'
            };


            it('/sensor/update', function () {

                var delta = {
                    name: 'Pikachu'
                };

                var updateData = {
                    sim: sensor.sim,
                    delta: delta
                };
                
                return expect(api.updateSensor(updateData)).to.be.rejectedWith('HTTP error');

            });

        });

        describe('Deletion', function(){
            var sensor = {
                name: 'Sensor1',
                sim: '290'
            };

            it('/sensor/delete', function () {

                var deleteData = {
                    sim: sensor.sim
                };

                return expect(api.deleteSensor(deleteData.sim)).to.be.rejectedWith('HTTP error');

            });
        });

        describe('Delete All Sensors', function(){

            it('/sensor/deleteAll', function () {

                return expect(api.deleteAllSensors()).to.be.rejectedWith('HTTP error');

            });
        });
    });
});




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

                var placeP = api.createPlace(place)

                expect(placeP).to.be.rejected;

                return placeP.catch(function(error){
                    expect(error.HTTPstatus).to.deep.equal(403);
                });
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

                var placeP = api.updatePlace(updateData);

                expect(placeP).to.be.rejectedWith('HTTP error');

                return placeP.catch(function(error){
                    expect(error.HTTPstatus).to.deep.equal(403);
                });
            });

        });

        describe('Deletion', function(){
            var id;

            it('/place/delete', function () {
                var placeP = api.deletePlace(id);

                expect(placeP).to.be.rejectedWith('HTTP error');

                return placeP.catch(function(error){
                    expect(error.HTTPstatus).to.deep.equal(403);
                });
            });

        });

        describe('Delete All Places', function(){

            it('/place/deleteAll', function () {
                var placeP = api.deleteAllPlaces();

                expect(placeP).to.be.rejectedWith('HTTP error');

                return placeP.catch(function(error){
                    expect(error.HTTPstatus).to.deep.equal(403);
                });
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
                var sensorP = api.createSensor(sensor);

                expect(sensorP).to.be.rejectedWith('HTTP error');

                return sensorP.catch(function(error){
                    expect(error.HTTPstatus).to.deep.equal(403);
                });

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
                
                var sensorP = api.updateSensor(updateData);

                expect(sensorP).to.be.rejectedWith('HTTP error');

                return sensorP.catch(function(error){
                    expect(error.HTTPstatus).to.deep.equal(403);
                });

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

                var sensorP = api.deleteSensor(deleteData.sim);

                expect(sensorP).to.be.rejectedWith('HTTP error');

                return sensorP.catch(function(error){
                    expect(error.HTTPstatus).to.deep.equal(403);
                });

            });
        });

        describe('Delete All Sensors', function(){

            it('/sensor/deleteAll', function () {

                var sensorP = api.deleteAllSensors();

                expect(sensorP).to.be.rejectedWith('HTTP error');

                return sensorP.catch(function(error){
                    expect(error.HTTPstatus).to.deep.equal(403);
                });

            });
        });
    });
});




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

                return api.createPlace(place)
                .then(function(res){
                    expect(res.message).to.deep.equal('No token provided.');
                });
            });
        });

        describe('Update', function(){
            var id;

            before('Creating place to be updated', function(){

                var place = {
                    name: 'Place1',
                    lat: 44.840450,
                    lon: -0.570468
                };

                return api.createPlace(place)
                .then(function(res){
                    expect(res.message).to.deep.equal('No token provided.');
                });
            });

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

                return api.updatePlace(updateData)
                .then(function(res){
                    expect(res.message).to.deep.equal('No token provided.');
                });
            });

        });

        describe('Deletion', function(){
            var id;

            before('Creating place to be deleted', function(){

                var place = {
                    name: 'Place1',
                    lat: 44.840450,
                    lon: -0.570468
                };

                return api.createPlace(place)
                .then(function(res){
                    expect(res.message).to.deep.equal('No token provided.');
                });
            });

            it('/place/delete', function () {

                return api.deletePlace(id)
                .then(function(res){
                    expect(res.message).to.deep.equal('No token provided.');
                });
            });

        });

        describe('Delete All Places', function(){

            before('Creating places to be deleted', function(){

                var creationPs = [0, 1, 2].map(function(item){

                    var place = {
                        name: 'Place' + item,
                        lat: Math.random(),
                        lon: Math.random()
                    };

                    return api.createPlace(place);
                });

                return Promise.all(creationPs);
            
            });

            it('/place/deleteAll', function () {

                return api.deleteAllPlaces()
                .then(function(res){
                    expect(res.message).to.deep.equal('No token provided.');
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

                return api.createSensor(sensor)
                .then(function(res){
                    expect(res.message).to.deep.equal('No token provided.');
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
                .then(function(res){
                    expect(res.message).to.deep.equal('No token provided.');
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
                .then(function(res){
                    expect(res.message).to.deep.equal('No token provided.');
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
                .then(function(res){
                    expect(res.message).to.deep.equal('No token provided.');
                });

            });
        });
    });
});




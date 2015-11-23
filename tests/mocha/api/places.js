'use strict';
require('es6-shim');

var database = require('../../../database');
var sendReq = require('../../../tools/sendNodeReq');

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = chai.expect;

var prepareAPI = require('../../../tools/prepareAPI.js');
var PRIVATE = require('../../../PRIVATE.json');

var origin = 'http://localhost:4000'; // api
// var origin = 'http://192.168.59.103:4000';
var api = prepareAPI(sendReq, origin, PRIVATE.secret);


describe('Verify API', function() {
    this.timeout(2000);

    describe('Place', function () {

        before('clearing Place table', function(){
            return database.Places.deleteAll();
        });

        // after each test, clear the table
        afterEach('clearing Place Table', function(){
            return database.Places.deleteAll();
        });

        describe('Creation', function(){

            it('/place/create', function () {
                
                var place = {
                    name: 'Place1',
                    lat: 44.840450,
                    lon: -0.570468
                };

                return api.createPlace(place)
                .then(function(created){
                    expect(created.name).to.deep.equal('Place1');
                    expect(44.840450 - parseFloat(created.lat)).to.be.below(0.0001);
                    expect(-0.570468 - parseFloat(created.lon)).to.be.below(0.0001);
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
                .then(function(result){
                    id = result.id;
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
                .then(function(updated){
                    expect(updated.name).to.deep.equal('Place2');
                    expect(44.940450 - parseFloat(updated.lat)).to.be.below(0.0001);
                    expect(-0.500468 - parseFloat(updated.lon)).to.be.below(0.0001);
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
                .then(function(result){
                    id = result.id;
                });
            });

            it('/place/delete', function () {

                return api.deletePlace(id)
                .then(function(deleted){
                    expect(deleted.name).to.deep.equal('Place1');
                    expect(44.840450 - parseFloat(deleted.lat)).to.be.below(0.0001);
                    expect(-0.570468 - parseFloat(deleted.lon)).to.be.below(0.0001);
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
                .then(function(deleted){
                    expect(deleted.length).to.deep.equal(3);
                });

            });

        });

        describe('Get Place', function(){
            var id;

            before('Creating place', function(){

                var place = {
                    name: 'Place1',
                    lat: 44.840450,
                    lon: -0.570468
                };

                return api.createPlace(place)
                .then(function(result){
                    id = result.id;
                });
                
            });

            it('/place/get', function () {

                return api.getPlace(id)
                .then(function(fetched){
                    expect(fetched.name).to.deep.equal('Place1');
                    expect(44.840450 - parseFloat(fetched.lat)).to.be.below(0.0001);
                    expect(-0.570468 - parseFloat(fetched.lon)).to.be.below(0.0001);
                });

            });
        });

        describe('Get All Places', function(){

            before('Creating places', function(){

                var creationPs = [0, 1, 2, 3].map(function(item){

                    var place = {
                        name: 'Place' + item,
                        lat: Math.random(),
                        lon: Math.random()
                    };

                    return api.createPlace(place);
                });

                return Promise.all(creationPs);
                
            });

            it('/place/getAll', function () {

                return api.getAllPlaces()
                .then(function(fetcheds){
                    expect(fetcheds.length).to.deep.equal(4);
                });

            });
        });
    });
});




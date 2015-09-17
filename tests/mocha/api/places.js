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

    describe('Place Table ', function () {

        before('clearing Place table', function(ready){
            api.deleteAllPlaces()
            .then(function(){
                ready();
            })
            .catch(function(error){
                console.log("clearing Place table :", error);
            });
        });

        // after each test, clear the table
        afterEach('clearing Place Table', function(ready){
            api.deleteAllPlaces()
            .then(function(){
                ready();
            })
            .catch(function(error){
                console.log("clearing Place Table :", error);
            });
        });

        describe('Creation', function(){

            it("/place/create", function (done) {
                this.timeout(3000);

                var place = {
                    name: 'Place1',
                    lat: 44.840450,
                    lon: -0.570468
                };

                api.createPlace(place)
                .then(function(created){

                    // assert.strictEqual('Place1', created.name);
                    expect(44.840450 - parseFloat(created.lat)).to.be.below(0.0001);
                    expect(-0.570468 - parseFloat(created.lon)).to.be.below(0.0001);
                    done();
                })  
                .catch(function(err){
                    console.log('err in createPlace', err);
                });

            });
        });

        describe('Update', function(){
            var id;

            before('Creating place to be updated', function(ready){
                this.timeout(3000);

                var place = {
                    name: 'Place1',
                    lat: 44.840450,
                    lon: -0.570468
                };

                api.createPlace(place)
                .then(function(result){
                    id = result.id;
                    ready();
                })  
                .catch(function(err){
                    console.log('err in createPlace before place update', err);
                });
            });

            it("/update/place", function (done) {
                this.timeout(3000);

                var delta = {
                    name: 'Place2',
                    lat: 44.940450,
                    lon: -0.500468
                };

                var updateData = {
                    id: id,
                    delta: delta
                };

                api.updatePlace(updateData)
                .then(function(updated){
                    assert.strictEqual('Place2', updated.name);
                    expect(44.940450 - parseFloat(updated.lat)).to.be.below(0.0001);
                    expect(-0.500468 - parseFloat(updated.lon)).to.be.below(0.0001);

                    done();
                })  
                .catch(function(err){
                    console.log('err in updatePlace', err);
                });

            });

        });

        describe('Deletion', function(){
            var id;

            before('Creating place to be deleted', function(ready){
                this.timeout(3000);

                var place = {
                    name: 'Place1',
                    lat: 44.840450,
                    lon: -0.570468
                };

                api.createPlace(place)
                .then(function(result){
                    id = result.id;
                    ready();
                })  
                .catch(function(err){
                    console.log('err in place creation before deletion', err);
                });
            });

            it("/place/delete", function (done) {
                this.timeout(3000);

                var deleteData = {
                    id: id
                };

                api.deletePlace(deleteData.id)
                .then(function(deleted){
                    assert.strictEqual('Place1', deleted.name);
                    expect(44.840450 - parseFloat(deleted.lat)).to.be.below(0.0001);
                    expect(-0.570468 - parseFloat(deleted.lon)).to.be.below(0.0001);
                    done();
                })  
                .catch(function(err){
                    console.log('err in delete place', err);
                });

            });

        });

        describe('Delete All Places', function(){

            before('Creating places to be deleted', function(ready){
                this.timeout(3000);

                var creationPs = [0, 1, 2].map(function(item){

                    var place = {
                        name: 'Place' + item,
                        lat: Math.random(),
                        lon: Math.random()
                    };

                    return api.createPlace(place);
                });

                Promise.all(creationPs)
                .then(function(){
                    ready();
                })
                .catch(function(err){
                    console.log('err in createPlace place before delete all', err);
                });
                
            });

            it("/place/deleteAll", function (done) {
                this.timeout(3000);

                api.deleteAllPlaces()
                .then(function(deleted){
                    assert.strictEqual(3, deleted.length);

                    done();
                })  
                .catch(function(err){
                    console.log('err in deleteAllPlaces', err);
                });

            });

        });

        describe('Get Place', function(){
            var id;

            before('Creating place', function(ready){
                this.timeout(3000);

                var place = {
                    name: 'Place1',
                    lat: 44.840450,
                    lon: -0.570468
                };

                api.createPlace(place)
                .then(function(result){
                    id = result.id;
                    ready();
                })
                .catch(function(err){
                    console.log('err in createPlace before get', err);
                });
                
            });

            it("/place/get", function (done) {
                this.timeout(3000);

                api.getPlace(id)
                .then(function(fetched){
                    assert.strictEqual('Place1', fetched.name);
                    expect(44.840450 - parseFloat(fetched.lat)).to.be.below(0.0001);
                    expect(-0.570468 - parseFloat(fetched.lon)).to.be.below(0.0001);

                    done();
                })  
                .catch(function(err){
                    console.log('err in getPlace', err);
                });

            });

        });

        describe('Get All Places', function(){

            before('Creating places', function(ready){
                this.timeout(3000);

                var creationPs = [0, 1, 2, 3].map(function(item){

                    var place = {
                        name: 'Place' + item,
                        lat: Math.random(),
                        lon: Math.random()
                    };

                    return api.createPlace(place);
                });

                Promise.all(creationPs)
                .then(function(){
                    ready();
                })
                .catch(function(err){
                    console.log('err in createPlace before get all palces', err);
                });
                
            });

            it("/place/getAll", function (done) {
                this.timeout(3000);

                api.getAllPlaces()
                .then(function(fetcheds){
                    assert.strictEqual(4, fetcheds.length);

                    done();
                })  
                .catch(function(err){
                    console.log('err in getAllPlaces', err);
                });

            });
        });
    });
});




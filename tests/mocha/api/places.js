'use strict';

var database = require('../../database');
var sendReq = require('../../../tools/sendNodeReq');

var expect = require('chai').expect;

var prepareAPI = require('../../../tools/prepareAPI.js');

var origin = 'http://api:4000';
// var origin = 'http://192.168.59.103:4000';
var api = prepareAPI(sendReq, origin);


describe('Verify API', function() {

    describe('Place', function () {

        before('clearing Place table', function(ready){
            database.Places.deleteAll()
            .then(function(){
                ready();
            })
            .catch(function(error){
                console.log("clearing Place table :", error);
            });
        });

        // after each test, clear the table
        afterEach('clearing Place Table', function(ready){
            database.Places.deleteAll()
            .then(function(){
                ready();
            })
            .catch(function(error){
                console.log("clearing Place Table :", error);
            });
        });

        describe('Creation', function(){

            it("/place/create", function (done) {
                this.timeout(2000);

                var place = {
                    name: 'Place1',
                    lat: 44.840450,
                    lon: -0.570468
                };

                api.createPlace(place)
                .then(function(created){

                    expect(created.name).to.deep.equal('Place1');
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
                this.timeout(2000);

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

                api.updatePlace(updateData)
                .then(function(updated){
                    expect(updated.name).to.deep.equal('Place2');
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
                this.timeout(2000);

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
                this.timeout(2000);

                var deleteData = {
                    id: id
                };

                api.deletePlace(deleteData.id)
                .then(function(deleted){
                    expect(deleted.name).to.deep.equal('Place1');
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
                this.timeout(2000);

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
                this.timeout(2000);

                api.deleteAllPlaces()
                .then(function(deleted){
                    expect(deleted.length).to.deep.equal(3);

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
                this.timeout(2000);

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
                this.timeout(2000);

                api.getPlace(id)
                .then(function(fetched){
                    expect(fetched.name).to.deep.equal('Place1');
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
                this.timeout(2000);

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
                this.timeout(2000);

                api.getAllPlaces()
                .then(function(fetcheds){
                    expect(fetcheds.length).to.deep.equal(4);

                    done();
                })  
                .catch(function(err){
                    console.log('err in getAllPlaces', err);
                });

            });
        });
    });
});




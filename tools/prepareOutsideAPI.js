"use strict";

var sendNodeReq = require('./sendNodeReq.js');
var boot2dockerIp = require('./boot2dockerIp.js');

/* 

    This function is just a wrapper around classic server-to-server request functions.
    It was written to ease the calls to Pheromon DB API for testing purposes.

*/

var PORT = 4000; // Port of the Pheromon docker

module.exports = function(){
    return boot2dockerIp()
    .then(function(host){

        return {
            host: host,
            api: {
                // SENSORS
                createSensor: function(data){
                    var method = 'POST';
                    var url = 'http://' + host + ':' + PORT + '/sensor/create';

                    return sendNodeReq(method, url, data);
                },
                updateSensor: function(data){
                    var method = 'POST';
                    var url = 'http://' + host + ':' + PORT + '/sensor/update';

                    return sendNodeReq(method, url, data);
                },
                deleteSensor: function(id){
                    var method = 'DELETE';
                    var url = 'http://' + host + ':' + PORT + '/sensor/delete/' + id;

                    return sendNodeReq(method, url);
                },
                deleteAllSensors: function(){
                    var method = 'DELETE';
                    var url = 'http://' + host + ':' + PORT + '/sensor/deleteAll';

                    return sendNodeReq(method, url);
                },
                getSensor: function(id){
                    var method = 'GET';
                    var url = 'http://' + host + ':' + PORT + '/sensor/get/' + id;

                    return sendNodeReq(method, url);
                },
                getAllSensors: function(){
                    var method = 'GET';
                    var url = 'http://' + host + ':' + PORT + '/sensor/getAll';

                    return sendNodeReq(method, url);
                },

                // PLACES
                createPlace: function(data){
                    var method = 'POST';
                    var url = 'http://' + host + ':' + PORT + '/place/create';

                    return sendNodeReq(method, url, data);
                },
                updatePlace: function(data){
                    var method = 'POST';
                    var url = 'http://' + host + ':' + PORT + '/place/update';

                    return sendNodeReq(method, url, data);
                },
                deletePlace: function(id){
                    var method = 'DELETE';
                    var url = 'http://' + host + ':' + PORT + '/place/delete/' + id;

                    return sendNodeReq(method, url);
                },
                deleteAllPlaces: function(){
                    var method = 'DELETE';
                    var url = 'http://' + host + ':' + PORT + '/place/deleteAll';

                    return sendNodeReq(method, url);
                },
                getPlace: function(id){
                    var method = 'GET';
                    var url = 'http://' + host + ':' + PORT + '/place/get/' + id;

                    return sendNodeReq(method, url);
                },
                getAllPlaces: function(){
                    var method = 'GET';
                    var url = 'http://' + host + ':' + PORT + '/place/getAll';

                    return sendNodeReq(method, url);
                }
            }
        };

    })
    .catch(function(err){
        console.log('err', err);
    });
};





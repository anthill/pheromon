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
                createSensor: function(data){
                    var method = 'POST';
                    var url = 'http://' + host + ':' + PORT + '/createSensor';

                    return sendNodeReq(method, url, data);
                },
                updateSensor: function(data){
                    var method = 'POST';
                    var url = 'http://' + host + ':' + PORT + '/updateSensor';

                    return sendNodeReq(method, url, data);
                },
                removeSensor: function(id){
                    var method = 'POST';
                    var url = 'http://' + host + ':' + PORT + '/removeSensor/' + id;

                    return sendNodeReq(method, url);
                },
                removeAllSensors: function(){
                    var method = 'POST';
                    var url = 'http://' + host + ':' + PORT + '/removeAllSensors';

                    return sendNodeReq(method, url);
                },
                getSensor: function(id){
                    var method = 'GET';
                    var url = 'http://' + host + ':' + PORT + '/getSensor/' + id;

                    return sendNodeReq(method, url);
                },
                getAllSensors: function(){
                    var method = 'GET';
                    var url = 'http://' + host + ':' + PORT + '/getAllSensors';

                    return sendNodeReq(method, url);
                }
            }
        };

    })
    .catch(function(err){
        console.log('err', err);
    });
};





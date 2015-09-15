'use strict';

require("es6-shim");
var request = require('request');


var sensor = {
    name: 'Sensor1',
    phone_number: 270
};

var sensorRemoval = {
    id: 2
};

request.post({
    url: 'http://192.168.59.103:4000/createSensor',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(sensor)
}, function(err, resp, body){

    if (err)
        console.log('error', err);
    else {
        console.log('body', body);
        request.get({
            url: 'http://192.168.59.103:4000/allSensors',
            headers: {
                'Content-Type': 'application/json'
            }
        }, function(error, response, body){

            if (error)
                console.log('error', error);
            else {
                console.log('body', body);

                
            }
        })
    }
})

// request.post({
//     url: 'http://192.168.59.103:4000/removeSensor',
//     headers: {
//         'Content-Type': 'application/json'
//     },
//     body: JSON.stringify(sensorRemoval)
// }, function(err, resp, body){

//     if (err)
//         console.log('error', err);
//     else {
//         console.log('body', body);
//     }
// })
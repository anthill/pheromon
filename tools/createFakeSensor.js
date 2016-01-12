'use strict';

var mqtt = require('mqtt');

module.exports = function(simId, authToken){
    return new Promise(function(resolve, reject){
        console.log('Creating fake sensor');

        var newSensor = mqtt.connect('mqtt://broker:18830', { // connect to broker
            username: simId,
            password: authToken,
            clientId: simId
        });

        newSensor.on('connect', function(){
            console.log('Fake sensor connected');
            newSensor.subscribe(simId + '/#');
            newSensor.subscribe('all/#');

            resolve(newSensor);
        });

        newSensor.on('error', function(e){
            reject(e);
        });
    });
};

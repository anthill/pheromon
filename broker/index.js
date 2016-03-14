'use strict';

/*
    MQTT Broker initilization
*/

var PORT = parseInt(process.env.BROKER_PORT, 10) || 1883;

require('es6-shim');
var makeMqttServer = require('./makeMqttServer.js');

var PRIVATE = require('../PRIVATE/secret.json');

makeMqttServer(PRIVATE.mqtt_token)
.then(function(){
    console.log('MQTT broker ready on port', PORT);
})
.catch(function(err){
    console.log('Couldn\'t set the broker up', err);
});


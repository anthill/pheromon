'use strict';

/*
    MQTT Broker initilization
*/

require('es6-shim');
var makeMqttServer = require('./makeMqttServer.js');

var PRIVATE = require('../PRIVATE/secret.json');

makeMqttServer(PRIVATE.mqtt_token)
.then(function(){
    console.log('MQTT broker ready on port', process.env.BROKER_PORT);
})
.catch(function(err){
    console.log('Couldn\'t set the broker up', err);
});


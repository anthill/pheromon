"use strict";

/*
    MQTT Broker initilization
*/

require('es6-shim');
var makeMqttServer = require("./makeMqttServer.js");

var PRIVATE = require('../PRIVATE.json');

makeMqttServer(PRIVATE.token)
.then(function(mqttServer){
    console.log('MQTT broker ready');
})
.catch(function(err){
    console.log('Couldn\'t set the broker up', err);
});


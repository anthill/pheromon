'use strict';

var constants = require('./constants.js');

var myMap = new Map();

Object.keys(constants.wifiStatus).forEach(function(key){
	myMap.set(key.toLowerCase(), key);
});

Object.keys(constants.quipuStatus).forEach(function(key){
	myMap.set(key.toLowerCase(), key);
});

Object.keys(constants.bluetoothStatus).forEach(function(key){
	myMap.set(key.toLowerCase(), key);
});

module.exports = myMap;

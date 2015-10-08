'use strict';

var constants = require('./constants.js');

var myMap = new Map();

Object.keys(constants.wifiStatus).forEach(function(key){
	myMap.set(key.toLowerCase(), key);
});

Object.keys(constants.clientStatus).forEach(function(key){
	myMap.set(key.toLowerCase(), key);
});

Object.keys(constants.blueStatus).forEach(function(key){
	myMap.set(key.toLowerCase(), key);
});

Object.keys(constants.signalStatus).forEach(function(key){
	myMap.set(key.toLowerCase(), key);
});

module.exports = myMap;

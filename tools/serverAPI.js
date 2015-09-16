"use strict";

var sendReq = require('../tools/sendReq.js');

module.exports = {

    createSensor: function(data){
        return sendReq('POST', '/createSensor', data);
    },
    updateSensor: function(data){
        return sendReq('POST', '/updateSensor', data);
    },
    removeSensor: function(id){
        return sendReq('POST', '/removeSensor/' + id);
    },
    removeAllSensors: function(){
        return sendReq('POST', '/removeAllSensors');
    },
    getSensor: function(id){
        return sendReq('POST', '/getSensor/' + id);
    },
    getAllSensors: function(){
        return sendReq('POST', '/getAllSensors');
    }


/*
    getLiveAffluence: function(){
        return sendReq('GET', '/live-affluence');
    },
    getPlaceMeasurements: function(id){
        return sendReq('GET', '/place/' + id);
    },
    getAllPlacesInfos: function(){
        return sendReq('GET', '/allPlacesInfos');
    },
    getAllSensors: function(){
        return sendReq('GET', '/allSensors');
    },
    updatePlace: function(data){
        return sendReq('POST', '/updatePlace', data);
    },
    
    createPlace: function(data){
        return sendReq('POST', '/createPlace', data);
    },
    removePlace: function(data){
        return sendReq('POST', '/removePlace', data);
    }  
*/  
};

"use strict";

var sendReq = require('../tools/sendReq.js');

module.exports = {

    createSensor: function(data){
        return sendReq('POST', '/sensor/create', data);
    },
    updateSensor: function(data){
        return sendReq('POST', '/sensor/update', data);
    },
    deleteSensor: function(id){
        return sendReq('DELETE', '/sensor/delete/' + id);
    },
    deleteAllSensors: function(){
        return sendReq('DELETE', '/sensor/deleteAll');
    },
    getSensor: function(id){
        return sendReq('POST', '/sensor/get/' + id);
    },
    getAllSensors: function(){
        return sendReq('POST', '/sensor/getAll');
    }


    createPlace: function(data){
        return sendReq('POST', '/place/create', data);
    },
    updatePlace: function(data){
        return sendReq('POST', '/place/update', data);
    },
    deletePlace: function(id){
        return sendReq('DELETE', '/place/delete/' + id);
    },
    deleteAllPlaces: function(){
        return sendReq('DELETE', '/place/deleteAll');
    },
    getPlace: function(id){
        return sendReq('POST', '/place/get/' + id);
    },
    getAllPlaces: function(){
        return sendReq('POST', '/place/getAll');
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
    }
*/  
};

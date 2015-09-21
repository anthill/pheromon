"use strict";

var sendReq = require('../../_common/js/sendReq.js');

module.exports = {
    getLiveAffluence: function(){
        return sendReq('GET', '/currentAffluence');
    },
    getPlaceMeasurements: function(id){
        return sendReq('GET', '/measurements/get/:placeId' + id);
    },
    getAllPlacesInfos: function(){
        return sendReq('GET', '/allPlacesInfos');
    },
    getAllSensors: function(){
        return sendReq('GET', '/sensor/getAll');
    },
    updatePlace: function(data){
        return sendReq('POST', '/place/update', data);
    },
    updateSensor: function(data){
        return sendReq('POST', '/sensor/update', data);
    },
    createPlace: function(data){
        return sendReq('POST', '/place/create', data);
    },
    deletePlace: function(data){
        return sendReq('POST', '/place/delete', data);
    },
    deleteSensor: function(data){
        return sendReq('POST', '/sensor/delete', data);
    },
    createSensor: function(data){
        return sendReq('POST', '/sensor/create', data);
    }
};

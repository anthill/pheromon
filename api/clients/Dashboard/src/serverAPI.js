"use strict";

var sendReq = require('../../_common/js/sendReq.js');

module.exports = {
    getAllPlacesLiveAffluence: function(){
        return sendReq('GET', '/currentAffluence');
    },
    getPlaceMeasurements: function(id){
        return sendReq('GET', '/measurements/get/:placeId' + id);
    },
    getAllSensors: function(){
        return sendReq('GET', '/sensor/getAll');
    }
};

"use strict";

module.exports = function(request, origin){

    var origin = origin || '';

    return {
        // SENSORS
        createSensor: function(data){
            return request('POST', origin + '/sensor/create', data);
        },
        updateSensor: function(data){
            return request('POST', origin + '/sensor/update', data);
        },
        deleteSensor: function(sim){
            return request('DELETE', origin + '/sensor/delete/' + sim);
        },
        deleteAllSensors: function(){
            return request('DELETE', origin + '/sensor/deleteAll');
        },
        getSensor: function(sim){
            return request('GET', origin + '/sensor/get/' + sim);
        },
        getAllSensors: function(){
            return request('GET', origin + '/sensor/getAll');
        },

        // PLACES
        createPlace: function(data){
            return request('POST', origin + '/place/create', data);
        },
        updatePlace: function(data){
            return request('POST', origin + '/place/update', data);
        },
        deletePlace: function(id){
            return request('DELETE', origin + '/place/delete/' + id);
        },
        deleteAllPlaces: function(){
            return request('DELETE', origin + '/place/deleteAll');
        },
        getPlace: function(id){
            return request('GET', origin + '/place/get/' + id);
        },
        getAllPlaces: function(){
            return request('GET', origin + '/place/getAll');
        },
        
        // TO UPDATE
        getLiveAffluence: function(){
            return request('GET', origin + '/currentAffluence');
        },
        getPlaceMeasurements: function(data){
            return request('POST', origin + '/measurements/place', data);
        },
        getMeasurements: function(data){
            return request('POST', origin + '/measurements/sensor', data);
        },
        getAllPlacesInfos: function(){
            return request('GET', origin + '/allPlacesInfos');
        }
    };
};





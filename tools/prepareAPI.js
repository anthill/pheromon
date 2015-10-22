'use strict';

module.exports = function(request, origin, token){

    origin = origin || '';
    token = token || '';
    var tokenString = '?s=' + token;

    return {
        // SENSORS
        createSensor: function(data){
            return request('POST', origin + '/sensor/create' + tokenString, data);
        },
        updateSensor: function(data){
            return request('POST', origin + '/sensor/update' + tokenString, data);
        },
        deleteSensor: function(sim){
            return request('DELETE', origin + '/sensor/delete/' + sim + tokenString);
        },
        deleteAllSensors: function(){
            return request('DELETE', origin + '/sensor/deleteAll' + tokenString);
        },
        getSensor: function(sim){
            return request('GET', origin + '/sensor/get/' + sim);
        },
        getAllSensors: function(){
            return request('GET', origin + '/sensor/getAll');
        },

        // PLACES
        createPlace: function(data){
            return request('POST', origin + '/place/create' + tokenString, data);
        },
        updatePlace: function(data){
            return request('POST', origin + '/place/update' + tokenString, data);
        },
        deletePlace: function(id){
            return request('DELETE', origin + '/place/delete/' + id + tokenString);
        },
        deleteAllPlaces: function(){
            return request('DELETE', origin + '/place/deleteAll' + tokenString);
        },
        getPlace: function(id){
            return request('GET', origin + '/place/get/' + id);
        },
        getAllPlaces: function(){
            return request('GET', origin + '/place/getAll');
        },
        
        // TO UPDATE
        getCurrentPlaceMeasurements: function(type){
            return request('GET', origin + '/currentPlaceMeasurements/' + type);
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





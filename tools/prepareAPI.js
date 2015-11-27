'use strict';

// Concats every paramater in a url postifx string
var makeSearchString = function (obj){

    if(obj === undefined) return '';
    
    // http://stackoverflow.com/a/3608791
    return '?' + Object.keys(obj).map(function(k){
        return encodeURI(k) + '=' + encodeURI(obj[k]);
    })
    .join('&');
};


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
            return request('GET', origin + '/sensor/get/' + sim + tokenString);
        },
        getAllSensors: function(){
            return request('GET', origin + '/sensor/getAll' + tokenString);
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
        placeLatestMeasurement: function(placeId, type){
            return request('GET', origin + '/placeLatestMeasurement/' + placeId + '/' + type);
        },
        placesLatestMeasurement: function(type){
            return request('GET', origin + '/placesLatestMeasurement/' + type);
        },
        sensorsLatestMeasurement: function(data){
            return request('GET', origin + '/sensorsLatestMeasurement' + makeSearchString(Object.assign({s: token}, data)));
        },
        measurementsPlaces: function(data){
            return request('GET', origin + '/measurements/places' + makeSearchString(data));
        },
        measurementsSensors: function(data){
            return request('GET', origin + '/measurements/sensors' + makeSearchString(Object.assign({s: token}, data)));
        },
        getAllPlacesInfos: function(){
            return request('GET', origin + '/allPlacesInfos');
        },
        sensorRawMeasurements: function (data){
            return request('GET', origin + '/measurements/sensor/raw' + makeSearchString(Object.assign({s: token}, data)));
        },
        placeRawMeasurements: function (data){
            return request('GET', origin + '/measurements/place/raw' + makeSearchString(data));
        }
    };
};





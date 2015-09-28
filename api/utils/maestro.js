'use strict';

var pokemon = require("pokemon-names");
var database = require('../../database');

var CONF = require('../../CONF.json');

function checkSensor(sim, sim2sensor){

    if (!sim2sensor[sim]){
        // if sensor was never registered, create it
        return database.Sensors.create({
            'name': pokemon.random(),
            'sim': sim,
            'period': CONF.period,
            'start_hour': CONF.start_hour,
            'stop_hour': CONF.stop_hour
        })
        .then(function(sensor){
            sim2sensor[sim] = sensor;
        });
    }
    else
        return Promise.resolve();
}

function importSensors(){
    var sim2sensor = {};

    return database.Sensors.getAll()
    .then(function(sensors){
        sensors.forEach(function(sensor){
            sim2sensor[sensor.sim] = sensor;
        });

        return sim2sensor;
    });
}

module.exports = {
    importSensors: importSensors,
    checkSensor: checkSensor
};
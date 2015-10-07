'use strict';

var pokemon = require('pokemon-names');
var database = require('../../database');
var debug = require('../../tools/debug');

var CONF = require('../../CONF.json');

function checkSensor(sim, sim2sensor){
    if (sim2sensor[sim] === undefined){
        debug('Sensor not present in cache, creating in DB');
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
            return true;
        });
    }
    else
        return Promise.resolve(false);
}

function importSensors(){
    var sim2sensor = {};

    return database.Sensors.getAll()
    .then(function(sensors){

        debug('Got all sensors from DB', sensors);

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

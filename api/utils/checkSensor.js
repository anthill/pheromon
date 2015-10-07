'use strict';

var pokemon = require('pokemon-names');
var database = require('../../database');
var debug = require('../../tools/debug');

var CONF = require('../../CONF.json');

module.exports = function(sim){
    return database.Sensors.get(sim)
    .then(function(sensor){
        if (sensor){
            debug('SENSOR IN DB, YAY', sensor);
            return sensor;
        }
        else {
            debug('SENSOR NOT IN DB, CREATING');

            return database.Sensors.create({
                'name': pokemon.random(),
                'sim': sim,
                'period': CONF.period,
                'start_hour': CONF.start_hour,
                'stop_hour': CONF.stop_hour
            })
            .then(function(sensor){
                debug('SENSOR NOT IN DB, CREATING');
                return sensor;
            })
            .catch(function(err){
                console.log('Error in sensor check', err);
            });
        }  
    })
}

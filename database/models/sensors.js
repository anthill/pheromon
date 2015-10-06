'use strict';

var sql = require('sql');
sql.setDialect('postgres');
var databaseP = require('../management/databaseClientP');

var databaseMeasurements = require('./measurements.js');

var sensors = require('../management/declarations.js').sensors;

module.exports = {
    create: function (data) {
        return databaseP.then(function (db) {

            var query = sensors
                .insert(data)
                .returning('*')
                .toQuery();

            //console.log('sensors create query', query);
            return new Promise(function (resolve, reject) {
                db.query(query, function (err, result) {
                    if (err) reject(err);
                    else
                        resolve(result.rows[0]);
                        
                });
            });
        })
        .catch(function(err){
            console.log('ERROR in create', err);
        });  
    },
    
    update: function(sim, delta) {
        return databaseP.then(function (db) {
            var query = sensors
                .update(delta)
                .where(sensors.sim.equals(sim))
                .returning('*')
                .toQuery();

            //console.log('sensors findBySIMid query', query);
            return new Promise(function (resolve, reject) {
                db.query(query, function (err, result) {
                    if (err)
                        reject(err);
                    else {
                        console.log('UPDATED', result.rows[0]);
                        resolve(result.rows[0]);
                    }
                        
                });
            });
        })
        .catch(function(err){
            console.log('ERROR in update', err);
        });        
    },

    get: function(sim){
        return databaseP.then(function (db) {
            
            var query = sensors
                .select('*')
                .where(sensors.sim.equals(sim))
                .from(sensors)
                .toQuery();

            return new Promise(function (resolve, reject) {
                db.query(query, function (err, result) {
                    if (err) reject(err);

                    else resolve(result.rows[0]);
                });
            });
        })
        .catch(function(err){
            console.log('ERROR in getSensor', err);
        }); 
    },

    getAll: function() {
        return databaseP.then(function (db) {
            
            var query = sensors
                .select('*')
                .from(sensors)
                .toQuery();

            return new Promise(function (resolve, reject) {
                db.query(query, function (err, result) {
                    if (err) reject(err);

                    else
                        resolve(result.rows);
                });
            });
        })
        .catch(function(err){
            console.log('ERROR in getAllSensors', err);
        });        
    },

    delete: function(id) {
        return databaseP
        .then(function (db) {
            
            // Delete related measurements
            return databaseMeasurements.deleteById(id)
            .then(function() {

                var query = sensors
                    .delete()
                    .where(sensors.sim.equals(id))
                    .returning('*')
                    .toQuery();

                return new Promise(function (resolve, reject) {
                    db.query(query, function (err, result) {
                        if (err) reject(err);
                        else resolve(result.rows[0]);
                    });
                });
            });
        })
        .catch(function(err){
            console.log('ERROR in delete sensors', err);
        });        
    },

    deleteAll: function() {
        return databaseP
        .then(function (db) {
            
            // Delete all measurements too (no sensors = no measurements)
            return databaseMeasurements.deleteAll()
            .then(function() {

                var query = sensors
                    .delete()
                    .returning('*')
                    .toQuery();

                return new Promise(function (resolve, reject) {
                    db.query(query, function (err, result) {
                        if (err) reject(err);
                        else resolve(result.rows);
                    });
                });
            });
        })
        .catch(function(err){
            console.log('ERROR in deleteAll sensors', err);
        });        
    }

};

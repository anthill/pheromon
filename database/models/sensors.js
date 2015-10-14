'use strict';

var sql = require('sql');
sql.setDialect('postgres');
var databaseP = require('../management/databaseClientP');
var getRandomName = require('pokemon-names').random;

var sensorTable = require('../management/declarations.js').sensors;
var outputTable = require('../management/declarations.js').outputs;

module.exports = {
    create: function (data) {

        var types = data.outputs ||[];
        var sensorData = Object.keys(sensorTable).reduce(function(acc, k){
            if (data[k])
                acc[k] = data[k];
            return acc;
        }, {});

        // first create the sensor
        return databaseP.then(function (db) {

            if (typeof(sensorData.sim) !== 'string' && sensorData.sim.length === 0) {
                throw 'Cannot create sensor : no SIM';
            }
            if (!sensorData.name)
                sensorData.name = getRandomName();
            var query = sensorTable
                .insert(sensorData)
                .returning('*')
                .toQuery();

            return new Promise(function (resolve, reject) {
                db.query(query, function (err, result) {
                    if (err) reject(err);
                    else
                        resolve(result.rows[0]);        
                });
            })
            // then create the corresponding inputs
            .then(function(sensor){
                if (types.length !== 0){
                    var insertData = types.map(function(type){
                        return {
                            sensor_id: sensor.id,
                            type: type
                        };
                    });

                    var query = outputTable
                    .insert(insertData)
                    .returning('*')
                    .toQuery();

                    return new Promise(function (resolve, reject) {
                        db.query(query, function (err, result) {
                            if (err) reject(err);
                            else
                                resolve(result.rows);        
                        });
                    })
                    // finally return the sensor augmented with output status
                    .then(function(outputs){
                        sensor.outputs = outputs;
                        return sensor;
                    });
                }
                else {
                    sensor.outputs = [];
                    return sensor;
                }
                
            });
        })
        .catch(function(err){
            console.log('ERROR in create', err);
        });
    },
    
    update: function(sim, delta) {
        
        return databaseP.then(function (db) {

            var query = sensorTable
                .update(delta)
                .where(sensorTable.sim.equals(sim))
                .returning('*')
                .toQuery();

            return new Promise(function (resolve, reject) {
                db.query(query, function (err, result) {
                    if (err)
                        reject(err);
                    else
                        resolve(result.rows[0]);
                });
            });
        })
        .catch(function(err){
            console.log('ERROR in updateSensor', err);
        });
    },

    updateOutput: function(id, type, delta){
        return databaseP.then(function (db) {

            var query = outputTable
                .update(delta)
                .where(outputTable.sensor_id.equals(id), outputTable.type.equals(type))
                .returning('*')
                .toQuery();

            return new Promise(function (resolve, reject) {
                db.query(query, function (err, result) {
                    if (err) reject(err);
                    else
                        resolve(result.rows[0]);       
                });
            });
        })
        .catch(function(err){
            console.log('ERROR in updateSensorOuputs', err);
        });
    },

    get: function(sim){
        return databaseP.then(function (db) {
            
            var query = sensorTable
                .select('*')
                .where(sensorTable.sim.equals(sim))
                .toQuery();

            // first get the sensor
            return new Promise(function (resolve, reject) {
                db.query(query, function (err, result) {
                    if (err) reject(err);

                    else resolve(result.rows[0]);
                });
            })
            // then get the corresponding inputs
            .then(function(sensor){
                if (sensor){ // if the sensor exists in DB
                    var query = outputTable
                    .select('*')
                    .where(outputTable.sensor_id.equals(sensor.id))
                    .toQuery();

                    return new Promise(function (resolve, reject) {
                        db.query(query, function (err, result) {
                            if (err) reject(err);
                            else
                                resolve(result.rows);        
                        });
                    })
                    // finally return the sensor augmented with output status
                    .then(function(outputs){
                        sensor.outputs = outputs;
                        return sensor;
                    });
                }
                else //if the sensor doesn't exist in DB, return undefined
                    return sensor;
                
            });
        })
        .catch(function(err){
            console.log('ERROR in getSensor', err);
        }); 
    },

    getAll: function() {
        return databaseP.then(function (db) {
            
            var query = sensorTable
                .select('*')
                .toQuery();

            // first get the sensors
            return new Promise(function (resolve, reject) {
                db.query(query, function (err, result) {
                    if (err) reject(err);

                    else
                        resolve(result.rows);
                });
            })
            // then get the corresponding inputs for each sensor
            .then(function(sensors){

                var query = outputTable
                    .select('*')
                    .where(outputTable.sensor_id.in(sensors.map(function(s){ return s.id; })))
                    .toQuery();

                return new Promise(function (resolve, reject) {
                    db.query(query, function (err, result) {
                        if (err) reject(err);
                        else
                            resolve(result.rows);        
                    });
                })
                // finally return the sensor augmented with output status
                .then(function(outputs){
                    sensors.forEach(function(sensor){
                        sensor.outputs = [];
                        outputs.forEach(function(output){
                            if (output.sensor_id === sensor.id)
                                sensor.outputs.push(output);
                        });
                    });
                    return sensors;
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
            
            var query = sensorTable
                .delete()
                .where(sensorTable.sim.equals(id))
                .returning('*')
                .toQuery();

            return new Promise(function (resolve, reject) {
                db.query(query, function (err, result) {
                    if (err) reject(err);
                    else
                        resolve(result.rows[0]);
                });
            });
        })
        .catch(function(err){
            console.log('ERROR in delete Sensors', err);
        });        
    },

    deleteAll: function() {
        return databaseP
        .then(function (db) {
            
            var query = sensorTable
                .delete()
                .returning('*')
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
            console.log('ERROR in deleteAll Sensors', err);
        });        
    },

    addOutput: function(sim, type){
        var self = this;

        return databaseP
        .then(function (db) {
            
            return self.get(sim)
            .then(function(sensor){
                var query = outputTable
                    .insert({
                        sensor_id: sensor.id,
                        type: type
                    })
                    .returning('*')
                    .toQuery();

                return new Promise(function (resolve, reject) {
                    db.query(query, function (err, result) {
                        if (err) reject(err);
                        else
                            resolve(result.rows[0]);        
                    });
                })
                .then(function(output){
                    sensor.outputs.push(output);
                    return sensor;
                });
            });    
        })
        .catch(function(err){
            console.log('ERROR in Sensors add Output', err);
        });  
    }
};

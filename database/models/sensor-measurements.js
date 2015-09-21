"use strict";

var sql = require('sql');
sql.setDialect('postgres');
var databaseP = require('../management/databaseClientP');

var sensorMeasurements = require('../management/declarations.js').sensor_measurements;

module.exports = {
    create: function (data) {
        return databaseP.then(function (db) {
            
            var query = sensorMeasurements
                .insert(data)
                .returning('*')
                .toQuery();

            //console.log('sensorMesurements create query', query);

            return new Promise(function (resolve, reject) {
                db.query(query, function (err, result) {
                    if (err) reject(err);
                    else resolve(result.rows[0]);
                });
            });
        })
    }
};

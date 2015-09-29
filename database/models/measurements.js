"use strict";

var sql = require('sql');
sql.setDialect('postgres');
var databaseP = require('../management/databaseClientP');

var measurements = require('../management/declarations.js').measurements;

module.exports = {
    create: function (data) {
        console.log('Creating Measurment');
        return databaseP.then(function (db) {
            
            var query = measurements
                .insert(data)
                .returning('*')
                .toQuery();

            return new Promise(function (resolve, reject) {
                db.query(query, function (err, result) {
                    if (err) reject(err);
                    else {
                        console.log('measurement', result.rows);
                        resolve(result.rows[0]);
                    }
                });
            });
        })
    },

    deleteAll: function() {
        return databaseP.then(function (db) {
            
            var query = measurements
                .delete()
                .returning('*')
                .toQuery();

            return new Promise(function (resolve, reject) {
                db.query(query, function (err, result) {
                    if (err) reject(err);
                    else resolve(result.rows);
                });
            });
        })
        .catch(function(err){
            console.log('ERROR in deleteAll measurements', err);
        });        
    }
};

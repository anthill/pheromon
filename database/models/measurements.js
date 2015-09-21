"use strict";

var sql = require('sql');
sql.setDialect('postgres');
var databaseP = require('../management/databaseClientP');

var measurements = require('../management/declarations.js').measurements;

module.exports = {
    create: function (data) {
        return databaseP.then(function (db) {
            
            var query = measurements
                .insert(data)
                .returning('id')
                .toQuery();

            return new Promise(function (resolve, reject) {
                db.query(query, function (err, result) {
                    if (err) reject(err);
                    else resolve(result.rows[0].id);
                });
            });
        })
    }
};

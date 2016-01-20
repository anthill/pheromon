#!/usr/bin/env node

'use strict';

require('es6-shim');

var fs = require('fs');
var path = require('path');

var generateSqlDefinition = require('sql-generate');

var PRIVATE = require('../PRIVATE/secret.json');

// when ready, drop and create tables
var databaseClientP = require('../database/management/databaseClientP');
var dropAllTables = require('../database/management/dropAllTables.js');
var createTables = require('../database/management/createTables.js');

var conString = 'postgres://'+ PRIVATE.pg_user + ':' + PRIVATE.pg_pwd + '@localhost:5432/' + PRIVATE.db_name;

console.log('Init-db connection string', conString);

function generateDefinitions() {
    return new Promise(function(resolve, reject) {
        generateSqlDefinition({ dsn: conString, omitComments: true }, function(err, definitions) {
            if (err) {
                console.error(err);
                reject(err);
            }
            fs.writeFileSync(path.join(__dirname, '../database/management/declarations.js'), definitions.buffer);
            resolve();
        });
    });
}

(function tryRebuildDatabase(){
    console.log('Trying to rebuild database...');

    setTimeout(function(){
        databaseClientP
        .then(function(){
            dropAllTables()
            .catch(function(err){
                console.error('Couldn\'t drop tables', err);
                process.exit();
            })
            .then(createTables)
            .catch(function(err){
                console.error('Couldn\'t create tables', err);
                process.exit();
            })
            .then(function(){
               
                generateDefinitions()
                .then(function(){
                    console.log('Dropped and created the tables.');
                    process.exit();
                })
                .catch(function(err){
                    console.error('Couldn\'t write the schema', err);
                    process.exit();
                });
                
            })
            .catch(function(){
                tryRebuildDatabase();
            });
        })
        .catch(function(err){
            console.error('Couldn\'t connect tables', err);
            tryRebuildDatabase();
        });
    }, 1000);
})();

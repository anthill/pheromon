"use strict";

require('es6-shim');

var fs = require('fs');
var path = require('path');

var generateSqlDefinition = require('sql-generate');

// when ready, drop and create tables
var databaseClientP = require('../database/management/databaseClientP');

var dropAllTables = require('../database/management/dropAllTables.js');
var createTables = require('../database/management/createTables.js');


var conString = [
    "postgres://",
    process.env.POSTGRES_USER,
    ":", 
    process.env.POSTGRES_PASSWORD,
    "@",
    process.env.DB_PORT_5432_TCP_ADDR,
    ":",
    process.env.DB_PORT_5432_TCP_PORT,
    "/postgres"
].join('');

console.log('Init-db connection string', conString);
// postgres://postgres:elements@172.17.0.90:5432/postgres
// postgres://postgres:elements@172.17.0.90:5432/postgres

function generateDefinitions() {
    return new Promise(function(resolve, reject) {
        generateSqlDefinition({ dsn: conString, omitComments: true }, function(err, definitions) {
            if (err) {
                console.error(err);
                reject(err);
            }
            fs.writeFileSync(path.join(__dirname, "../database/management/declarations.js"), definitions.buffer);
            resolve();
        });
    });
}


module.exports = function(){

    console.log('hello');
    return new Promise(function(resolve, reject){
        // wait database to be created
        (function tryRebuildDatabase(){
            console.log("Trying to rebuild database...");
            
            setTimeout(function(){
                databaseClientP
                .then(function(client){
                    dropAllTables()
                    .catch(function(err){
                        console.error("Couldn't drop tables", err);
                        client.end();
                        reject(err);
                    })
                    .then(createTables)
                    .catch(function(err){
                        console.error("Couldn't create tables", err);
                        client.end();
                        reject(err);
                    })
                    .then(function(){   
                        if (!process.env.BACKUP) {
                            console.log('no backup file');
                            generateDefinitions()
                            .then(function(){
                                console.log("Dropped and created the tables.");
                                client.end();
                                resolve();
                            })
                            .catch(function(err){
                                console.error("Couldn't write the schema", err);
                                client.end();
                                reject();
                            });
                        }
                        else {
                            generateDefinitions()
                            .then(function(){
                                console.log('definitions generated');
                                client.end();
                                resolve();
                            })
                            .catch(function(err){
                                console.error("Couldn't write the schema", err);
                                client.end();
                                reject(err);
                            });
                        }
                    })
                    .catch(function(err){
                        tryRebuildDatabase()
                    })
                })
                .catch(function(err){
                    console.error("Couldn't connect tables", err);
                    tryRebuildDatabase();
                });
            }, 1000);
        })();
    });
};
'use strict';

var fs = require('fs');
var path = require('path');

var generateSqlDefinition = require('sql-generate');

// when ready, drop and create tables
var databaseClientP = require('../database/management/databaseClientP');

var dropAllTables = require('../database/management/dropAllTables.js');
var createTables = require('../database/management/createTables.js');

var PRIVATE = require('../PRIVATE/secret.json');

var isTest = process.env.NODE_ENV === 'test';

var pg_user = isTest ? process.env.POSTGRES_USER : PRIVATE.pg_user;
var pg_pwd = isTest ? process.env.POSTGRES_PASSWORD : PRIVATE.pg_pwd;
var pg_addr = isTest ? process.env.DB_PORT_5432_TCP_ADDR : 'localhost';
var pg_dbName = isTest ? 'postgres' : PRIVATE.db_name;

var conString = [
    'postgres://',
    pg_user,
    ':', 
    pg_pwd,
    '@',
    pg_addr,
    ':5432/',
    pg_dbName
].join('');

console.log('conString for Test init-db', conString);

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

module.exports = function(){

    return new Promise(function(resolve, reject){
        // wait database to be created
        (function tryRebuildDatabase(){
            console.log('Trying to rebuild database...');
            
            setTimeout(function(){
                databaseClientP
                .then(function(){
                    dropAllTables()
                    .catch(function(err){
                        console.error('Couldn\'t drop tables', err);
                    
                        reject(err);
                    })
                    .then(createTables)
                    .catch(function(err){
                        console.error('Couldn\'t create tables', err);
                    
                        reject(err);
                    })
                    .then(function(){   
                        if (!process.env.BACKUP) {
                            console.log('no backup file');
                            generateDefinitions()
                            .then(function(){
                                console.log('Dropped and created the tables.');
                            
                                resolve();
                            })
                            .catch(function(err){
                                console.error('Couldn\'t write the schema', err);
                            
                                reject();
                            });
                        }
                        else {
                            generateDefinitions()
                            .then(function(){
                                console.log('definitions generated');
                            
                                resolve();
                            })
                            .catch(function(err){
                                console.error('Couldn\'t write the schema', err);
                            
                                reject(err);
                            });
                        }
                    })
                    .catch(function(err){
                        tryRebuildDatabase()
                    })
                })
                .catch(function(err){
                    console.error('Couldn\'t connect tables', err);
                    tryRebuildDatabase();
                });
            }, 1000);
        })();
    });
};
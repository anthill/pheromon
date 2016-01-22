#!/usr/bin/env node

'use strict';

require('es6-shim');

// when ready, drop and create tables
var databaseClientP = require('./databaseClientP');
var dropAllTables = require('./dropAllTables.js');
var createTables = require('./createTables.js');

var generateDeclarations = require('./generateDeclarations.js');

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
               
                generateDeclarations()
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

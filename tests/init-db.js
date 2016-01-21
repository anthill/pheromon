'use strict';

// when ready, drop and create tables
var databaseClientP = require('../database/management/databaseClientP');
var dropAllTables = require('../database/management/dropAllTables.js');
var createTables = require('../database/management/createTables.js');

var generateDeclarations = require('../database/management/generateDeclarations.js');

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
                            generateDeclarations()
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
                            generateDeclarations()
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
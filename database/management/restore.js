#!/usr/bin/env node

'use strict';

require('es6-shim');

var child_process = require('child_process');
var fs = require('fs');
var spawn = child_process.spawn;
var zlib = require('zlib');

var connectToDB = require('./connectToDB.js');
var dropAllTables = require('./dropAllTables.js');

var dbConst = require('./getDbConst.js');

var inputFile = process.argv[2];

connectToDB()
.then(function(){
    return dropAllTables()
    .catch(function(err){
        console.error('Could not drop tables', err);
        process.exit();
    })
    .then(function(){
        console.log('Loading the data');
        if (inputFile.includes('gz')) {
            console.log('Gz format');
            var gzip = zlib.createGunzip();
            var readStream = fs.createReadStream(inputFile);
            var proc = spawn('psql', ['-p', 5432, '-h', dbConst.ADDR, '-U', dbConst.USER, '-d', dbConst.name]);
            
            return new Promise(function(resolve, reject){
                readStream
                    .pipe(gzip)
                    .pipe(proc.stdin)
                    .on('finish', function() {
                        resolve();
                    })
                    .on('error', function(error) {
                        reject(error);
                    });
            });
        }
        else
            spawn('psql', ['-p', 5432, '-h', dbConst.ADDR, '-U', dbConst.USER, '-w', '-f', inputFile]);
    })
    .catch(function(err){
        console.error('Could not load the data', err);
        process.exit();
    })
    .then(function(){
        console.log('Success!');
        process.exit();
    });
})
.catch(function(err){
    console.error('Could not connect to database', err);
});

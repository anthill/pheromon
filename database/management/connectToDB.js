'use strict';

var pg = require('pg');
var PRIVATE = require('../../PRIVATE/secret.json');

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

var MAX_ATTEMPTS = 10;
var INITIAL_TIMEOUT_TIME = 100;

module.exports = function(){
    var attempts = 0;
    
    return new Promise(function(resolve, reject){
        
        (function tryConnect(time){
            setTimeout(function(){
                
                var client = new pg.Client(conString);

                client.connect(function(err) {
                    if(err){
                        console.log('Couldn\'t connect to db', err);
                        if(attempts >= MAX_ATTEMPTS)
                            reject(err); 
                        else {
                            // wait twice more to give time and not overwhelm the database with useless attempts to connect
                            console.log('Retrying in ', 2*time);
                            tryConnect(2*time); 
                        }
                    }
                    else{
                        resolve(client);
                    }
                    
                    attempts++;
                });

            }, time);
        })(INITIAL_TIMEOUT_TIME);
        
    });
};

'use strict';

var pg = require('pg');

var CONNEXION_STRING = require('./getDbConst.js').conString;

var MAX_ATTEMPTS = 10;
var INITIAL_TIMEOUT_TIME = 100;

module.exports = function(){
    var attempts = 0;
    
    return new Promise(function(resolve, reject){
        
        (function tryConnect(time){
            setTimeout(function(){
                
                var client = new pg.Client(CONNEXION_STRING);

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

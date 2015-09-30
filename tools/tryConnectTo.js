'use strict';

var request = require('request');

var MAX_ATTEMPTS = 10;
var INITIAL_TIMEOUT_TIME = 100;

module.exports = function(origin){
    var attempts = 0;
    
    return new Promise(function(resolve, reject){
        
        (function tryingAfter(time){
            setTimeout(function(){

                request(origin, function(error, response){

                    if (error) {
                        if (attempts >= MAX_ATTEMPTS)
                            reject(error); 
                        else {
                            console.log('server not up yet, trying again');
                            // wait twice more to give time and not overwhelm the server 
                            tryingAfter(2*time); 
                        }  
                    }
                    else if(response.statusCode === 200){
                        console.log('Connected to', origin);
                        resolve();
                    }
                });
            }, time);
        })(INITIAL_TIMEOUT_TIME)
    });
};

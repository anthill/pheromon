"use strict";

var mosca = require('mosca');

var pubsubsettings = {
  type: 'redis',
  redis: require('redis'),
  db: 12,
  port: process.env.REDIS_PORT_6379_TCP_PORT,
  return_buffers: true, // to handle binary payloads
  host: process.env.REDIS_PORT_6379_TCP_ADDR
};

var moscaSettings = {
  port: 1883,
  backend: pubsubsettings
};


module.exports = function(authenticate){

    return new Promise(function(resolve, reject){

        var server = new mosca.Server(moscaSettings);

        setTimeout(function(){
            reject("error: couldn't spawn mqttServer");
        }, 3000);

        server.on('ready', function(){
            server.authenticate = authenticate;
            resolve(server);
        });

        // fired when a client connects
        server.on('clientConnected', function(client) {
            console.log('Client Connected:', client.id);
        });

        // fired when a client disconnects
        server.on('clientDisconnected', function(client) {
            console.log('Client Disconnected:', client.id);
        });


    });
}



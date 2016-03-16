'use strict';

var mosca = require('mosca');


var PORT = parseInt(process.env.BROKER_PORT, 10) || 1883;
var API_PORT = process.env.VIRTUAL_PORT ? process.env.VIRTUAL_PORT : 9000;
var ssl = require('../PRIVATE/secret.json').ssl;

var pubsubsettings = {
    type: 'redis',
    redis: require('redis'),
    db: 12,
    host: process.env.REDIS_PORT_6379_TCP_ADDR || 'localhost', // localhost is for prod, dev, alpha. The other is for tests
    return_buffers: true
};

var moscaSettings = {
    backend: pubsubsettings,
    persistence: {
        factory: mosca.persistence.Redis,
        host: process.env.REDIS_PORT_6379_TCP_ADDR || 'localhost' // localhost is for prod, dev, alpha. The other is for tests
    },
    interfaces: [
        { type: "mqtt", port: PORT },
        { type: "http", port: API_PORT, bundle: true },
        { type: "https", port: API_PORT, bundle: true, credentials: { keyPath: "/etc/ssl/" + ssl + ".key", certPath: "/etc/ssl/" + ssl + ".crt" }}
    ]
};

module.exports = function(authToken){

    return new Promise(function(resolve, reject){

        var server = new mosca.Server(moscaSettings);

        server.on('clientConnected', function(client) {
            console.log('Client', client.id, 'connected');
        });

        server.on('clientDisconnected', function(client) {
            console.log('Client', client.id, 'disconnected');
        });

        server.on('published', function(packet, client) {
            if (!client)
                client = {id: 'broker'};
            console.log('Client', client.id);
            console.log('published', packet.topic);
        });

        server.on('delivered', function(packet, client) {
            if (!client)
                client = {id: 'broker'};
            console.log('Client', client.id);
            console.log('received', packet.topic);
        });

        server.on('subscribed', function(topic, client) {
            console.log('Client', client.id, 'subscribed to', topic);
        });

        server.on('unsubscribed', function(topic, client) {
            console.log('Client', client.id, 'unsubscribed to', topic);
        });

        server.on('ready', function(){
            server.authenticate = function (client, username, token, callback) {
                var authorized;
                try {
                    authorized = (token.toString() === authToken);
                }
                catch(err) {
                    console.log('Error in broker authenticator:', err);
                    authorized = false;
                    callback(err);
                }

                if (authorized)
                    callback(null, authorized);
            };
            resolve(server);
        });

        setTimeout(function(){
            reject('error: couldn\'t spawn mqttServer');
        }, 3000);

    });
};

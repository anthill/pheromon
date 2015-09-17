"use strict";

require('es6-shim');
require('better-log').install();

var path = require('path');
var fs = require('fs');
var net = require('net');
var spawn = require('child_process').spawn;
var zlib = require('zlib');

var express = require('express');
var app = express();
var http = require('http');
var compression = require('compression');
var bodyParser = require('body-parser');
var schedule = require('node-schedule');

var makeTcpReceiver = require('../tools/makeTcpReceiver');
var routes = require('./routes.js');


var PORT = 4000;
var DEBUG = process.env.NODE_ENV === "development" ? true : false;
var tcpSocketEndpoint;

var server = new http.Server(app);

var io = require('socket.io')(server);

io.set('origins', '*:*');

io.on('connection', function(socket) {
    socket.on('cmd', function(cmd) {
        console.log('admin client data received');
        if (tcpSocketEndpoint) {
            tcpSocketEndpoint.write(JSON.stringify(cmd) + "\n");
        }
    })
});

var endpointConfig =
    {
        host: process.env.BROKER_PORT_5100_TCP_ADDR ? process.env.BROKER_PORT_5100_TCP_ADDR : "127.0.0.1",
        port: process.env.INTERNAL_PORT ? process.env.INTERNAL_PORT : 55555
    };

var debug = function() {
    if (DEBUG) {
        [].unshift.call(arguments, "[DEBUG Pheromon] ");
        console.log.apply(console, arguments);
    }
}

// listening to the reception server

var endpointInterval = setInterval(function() {
    tcpSocketEndpoint = net.connect(endpointConfig, function(){

        debug('connected to the reception server on '+ tcpSocketEndpoint.remoteAddress+':'+tcpSocketEndpoint.remotePort)
        
        var tcpSocketEndpointReceiver = makeTcpReceiver(tcpSocketEndpoint, "\n");

        tcpSocketEndpointReceiver.on('message', function(message) {
            var packet = JSON.parse(message);

            if (packet.type === 'status') {
                io.sockets.emit('status', packet.data);
            }
        })
            
    });

    tcpSocketEndpoint.on('error', function(err) {
        console.log('[ERROR]: INTERNAL SOCKET : ' + err.message);
    });

    tcpSocketEndpoint.on('connect', function() {
        console.log('connection')
        clearInterval(endpointInterval);
    });
}, 5000);


// Backup database everyday at 3AM
schedule.scheduleJob('0 3 * * *', function(){
    console.log("Backup database");
    var gzip = zlib.createGzip();
    var today = new Date();
    var wstream = fs.createWriteStream('/pheromon/data/backups/' + today.getDay() + '.txt.gz');
    var proc = spawn('pg_dump', ['-p', process.env.DB_PORT_5432_TCP_PORT, '-h', process.env.DB_PORT_5432_TCP_ADDR, '-U', process.env.POSTGRES_USER, '-d', process.env.POSTGRES_USER, '-w']);
    proc.stdout
        .pipe(gzip)
        .pipe(wstream);
    proc.stderr.on('data', function(buffer) {
        console.log(buffer.toString().replace('\n', ''));
    })
});



app.use(compression());
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

app.use("/leaflet.css", express.static(path.join(__dirname, '../node_modules/leaflet/dist/leaflet.css')));

app.use("/dygraph-combined.js", express.static(path.join(__dirname, '../node_modules/dygraphs/dygraph-combined.js')));

app.use("/Admin", express.static(path.join(__dirname, './clients/Admin')));
app.use("/Dashboard", express.static(path.join(__dirname, './clients/Dashboard')));
app.use("/_common", express.static(path.join(__dirname, './clients/_common')));


app.get('/', function(req, res){
    res.sendFile(path.join(__dirname, './clients/Dashboard/index.html'));
});

app.get('/Admin', function(req, res){
    res.sendFile(path.join(__dirname, './clients/Admin/index.html'));
});


app.get('/Admin-browserify-bundle.js', function(req, res){
    res.sendFile(path.join(__dirname, './clients/Admin-browserify-bundle.js'));
});

app.get('/Dashboard-browserify-bundle.js', function(req, res){
    res.sendFile(path.join(__dirname, './clients/Dashboard-browserify-bundle.js'));
});


routes(app, debug);

server.listen(PORT, function () {
    console.log('Server running on', [
        'http://localhost:',
        PORT
    ].join(''));
});


process.on('uncaughtException', function(e){
    console.error('uncaught', e, e.stack);
    process.kill();
});

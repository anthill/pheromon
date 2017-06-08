'use strict';

require('es6-shim');
require('better-log').install();

var path = require('path');

var express = require('express');
var app = express();
var http = require('http');
var compression = require('compression');
var bodyParser = require('body-parser');

var debug = require('../tools/debug');
var routes = require('./routes.js');

var PRIVATE = require('../PRIVATE/secret.json');
var DEBUG = process.env.NODE_ENV === 'development';

var server = new http.Server(app);
var io = require('socket.io')(server);
io.set('origins', '*:*');

// Creating API-side MQTT client: maestro !
require('./maestro')(PRIVATE.mqtt_token, io);

var PORT = PRIVATE.pheromon_port;

//CORS for GET
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.use(compression());
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

app.use('/leaflet.css', express.static(path.join(__dirname, '../node_modules/leaflet/dist/leaflet.css')));

app.use('/dygraph-combined.js', express.static(path.join(__dirname, '../node_modules/dygraphs/dygraph-combined.js')));

app.use('/Admin/css', express.static(path.join(__dirname, './clients/Admin/css')));
app.use('/Dashboard', express.static(path.join(__dirname, './clients/Dashboard')));
app.use('/_common', express.static(path.join(__dirname, './clients/_common')));


app.get('/', function(req, res){
    res.redirect('/Dashboard');
});

app.get('/Admin', function(req, res){ // maybe not necessary
    if(req.query.s === PRIVATE.html_token || DEBUG)
        res.sendFile(path.join(__dirname, './clients/Admin/index.html'));
    else
        res.status(403).send({success: false, message: 'No token provided.'});
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
    process.exit(1);
});

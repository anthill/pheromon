'use strict';
require('es6-shim');

var tryConnectTo = require('../tools/tryConnectTo.js');
var spawn = require('child_process').spawn;

var initDB = require('../tools/init-db.js');

var dbInitP = initDB();
var apiConnectP = tryConnectTo('http://api:4000');

Promise.all([dbInitP, apiConnectP])
.then(function(){
    console.log('Running tests');

    var mochaTests = spawn('mocha', ['--recursive', 'tests/mocha/'], {stdio: 'inherit'});
});

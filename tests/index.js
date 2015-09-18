'use strict';
require('es6-shim');

var tryConnectTo = require('../tools/tryConnectTo.js');
var spawn = require('child_process').spawn;


tryConnectTo('http://api:4000')
.then(function(){
    console.log('Running tests');

    var mochaTests = spawn('mocha', ['--recursive', 'tests/mocha/'], {stdio: 'inherit'});

});

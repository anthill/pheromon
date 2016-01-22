'use strict';

require('es6-shim');

var fs = require('fs');
var path = require('path');
var generateSqlDefinition = require('sql-generate');

var CONNECTION_STRING = require('./getDbConst.js').CONNECTION_STRING;

module.exports = function() {
    return new Promise(function(resolve, reject) {
        generateSqlDefinition({ dsn: CONNECTION_STRING, omitComments: true }, function(err, definitions) {
            if (err) {
                console.error(err);
                reject(err);
            }
            fs.writeFileSync(path.join(__dirname, './declarations.js'), definitions.buffer);
            resolve();
        });
    });
};

'use strict';

require('es6-shim');

var fs = require('fs');
var path = require('path');
var generateSqlDefinition = require('sql-generate');

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

console.log('CONSTRING', conString);

module.exports = function() {
    return new Promise(function(resolve, reject) {
        generateSqlDefinition({ dsn: conString, omitComments: true }, function(err, definitions) {
            if (err) {
                console.error(err);
                reject(err);
            }
            fs.writeFileSync(path.join(__dirname, './declarations.js'), definitions.buffer);
            resolve();
        });
    });
};

'use strict';

var isTest = process.env.NODE_ENV === 'test';

var PRIVATE = require('../../PRIVATE/secret.json');

var user = isTest ? process.env.POSTGRES_USER : PRIVATE.pg_user;
var pwd = isTest ? process.env.POSTGRES_PASSWORD : PRIVATE.pg_pwd;
var addr = isTest ? process.env.DB_PORT_5432_TCP_ADDR : 'localhost';
var name = isTest ? 'postgres' : PRIVATE.db_name;

var conString = [
    'postgres://',
    user,
    ':', 
    pwd,
    '@',
    addr,
    ':5432/',
    name
].join('');

console.log('CONSTRING', conString);

module.exports = {
	USER: user,
	PWD: pwd,
	ADDR: addr,
	NAME: name,
	CONNECTION_STRING: conString
};

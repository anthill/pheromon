"use strict";

var sixSenseDecoder = require('6sense/src/codec/decodeFromSMS.js');
var genericCodec = require('quipu/parser.js');
require('es6-shim');


function getDataType(data) {
	if (data.toString().match(/^net(NODATA|GPRS|EDGE|3G|H\/H+)$/))
		return 'network'
	else if (data.toString().match("init *"))
		return 'request'
	else if (data.toString().slice(0, 1) === '0')
		return 'message'
	else if (data.toString().slice(0, 1) === '1')
		return 'data'
	else if (data.toString().slice(0, 1) === '2')
		return 'status'
	else
		return 'other'
}

function printMsg(msg, sim) {
	return new Promise(function(resolve) {
		decode(msg)
		.then(function(decoded) {
			var type = getDataType(msg);
			switch (type) {
				case 'network':
					console.log('['+sim+']'+"[NETWORK]>" + decoded.toString());
					break;
				case 'request':
					console.log('['+sim+']'+"[REQUEST]>" + decoded.toString());
					break;
				case 'message':
					console.log('['+sim+']'+"[MESSAGE]>" + decoded.toString());
					break;
				case 'data':
					console.log('['+sim+']'+"[DATA]   >" + decoded.toString());
					break;
				case 'status':
					console.log('['+sim+']'+"[STATUS] >" + decoded.toString());
					break;
				default:
					console.log('['+sim+']'+"[OTHER]  >" + decoded.toString());
					break;
			}

			resolve({decoded: decoded.toString(), type: type});
		})
	});
}

// Decode any message received by SMS or TCP
function decode(message) {

	return new Promise(function(resolve){

		switch (message[0]) {
			case '0': // message : not encoded
				resolve(message.slice(1));
				break;

			case '1': // data : 6sense_encoded
				sixSenseDecoder(message.slice(1).toString())
					.then(function(decodedMessage){
						resolve(JSON.stringify(decodedMessage));
					})
					.catch(function(err){
						console.log("error in case 1 ", err);
					})
				break;

			case '2': // status : generic_encoded
				genericCodec.decode(message.slice(1).toString())
					.then(function(decodedMessage){
						resolve(JSON.stringify(decodedMessage));
					})
					.catch(function(err){
						console.log("error in case 2 ", err);
					})
				break;
				
			default :
				resolve(message); // not a message, data or status (can be a network, sim, etc...)
				break;
		}

	})
	
}

module.exports = {printMsg: printMsg, decode: decode, getDataType: getDataType};

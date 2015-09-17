"use strict";

var exec = require("child_process").exec;


module.exports = function(){
	return new Promise(function(resolve, reject) {
		exec("boot2docker ip", function(error, ip){
			if (error)
				resolve("localhost");
			else {
				resolve(ip.trim());
			}
		});
	});
};
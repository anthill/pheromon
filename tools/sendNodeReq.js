'use strict';

var request = require('request');

module.exports = function (method, url, data){
    return new Promise(function(resolve, reject){

        var headers;

        if (data !== undefined && typeof data !== 'string' /* && !(data instanceof FormData)*/){
            headers = {'Content-Type': 'application/json;charset=UTF-8'};
            data = JSON.stringify(data);
        }
        console.log(url);
        request({
            method: method.toUpperCase(),
            url: url,
            headers: headers,
            body: data
        }, function(error, response, body){
            if (!error) {
                if(response.statusCode < 400)
                    resolve(JSON.parse(body));
                else {
                    reject(Object.assign(
                        new Error('HTTP error because of bad status code ' + body),
                        {
                            HTTPstatus: response.statusCode,
                            text: body,
                            error: error
                        }
                    ));
                }
            }
            else {
                reject(Object.assign(
                        new Error('HTTP error'),
                        {
                            HTTPstatus: response.statusCode,
                            text: body,
                            error: error
                        }
                    ));
            }
        });

    });
};

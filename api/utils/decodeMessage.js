'use strict';

var sigCodec = require('pheromon-codecs').signalStrengths;
var trajCodec = require('pheromon-codecs').trajectories;

// Decode a message in function of its type
function decodeMessage(message, type) {


    var trajectoriesCodecOptions = {
        precisionSignalStrength: 1,
        precisionDate: 30
    }

    return new Promise(function (resolve, reject) {

        switch (type) {
            case 'wifi':
            case 'wifi_old':
            case 'bluetooth':
                sigCodec.decode(message)
                .then(resolve)
                .catch(reject);
                /*
                    {
                        date:
                        devices: [
                            {
                                signal_strengh:
                            }
                        ]
                    }
                */

            break;

            case 'trajectories':
                trajCodec.decode(message, trajectoriesCodecOptions)
                .then(resolve)
                .catch(reject);
                /*
                    [ // trajectories
                        [ // trajectory
                            { // point
                                date: Date(),
                                signal_strength: int
                            },
                            ...
                        ],
                        ...
                    ]
                */
            break;

            default:
                console.log('Measurement only encoded by MQTT');
                resolve(JSON.parse(message.toString()));
                // reject(new Error('measurement type not supported by decode'));
        }
    });
}


// Extract measurements informations from decoded data
function extractMeasurementsFromData(data, type) {
    switch (type) {
        case 'wifi':
        case 'wifi_old':
        case 'bluetooth':
            return [ // wifi and bluetooth messages correspond to only one measurement
                {
                    value: data.devices.map(function (measurement) {
                        return measurement.signal_strength;
                    }),
                    date: data.date
                }];

        case 'trajectories': // trajectories messages contains many measurements (1 per trajectory)
            return data.map(function (trajectory) {
                return {
                    value: trajectory,
                    date: trajectory.reduce(function (previous, current) {
                        return previous.date.getTime() < current.date.getTime() ? previous : current;
                    }, trajectory[0]).date
                };
            });

        default:
            return [data];
    }
}

module.exports = {
    decodeMessage: decodeMessage,
    extractMeasurementsFromData: extractMeasurementsFromData
};

'use strict';

var keyMirror = require('keymirror');

var wifiStatus = keyMirror({
    NODATA: null,
    SLEEPING: null,
    MONITORING: null,
    RECORDING: null
});

var signalKeys = {};

signalKeys['NODATA'] = null;
signalKeys['GPRS'] = null;
signalKeys['EDGE'] = null;
signalKeys['3G'] = null;
signalKeys['H/H+'] = null;

var signalStatus = keyMirror(signalKeys);

var clientStatus = keyMirror({
    DISCONNECTED: null,
    CONNECTED: null,
    TUNNELLING: null
});

var blueStatus = keyMirror({
    NODATA: null,
    UNINITIALIZED: null,
    INITIALIZED: null,
    RECORDING: null
});

module.exports = {
    wifiStatus: wifiStatus,
    clientStatus: clientStatus,
    signalStatus: signalStatus,
    blueStatus: blueStatus
};

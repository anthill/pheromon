'use strict';

var keyMirror = require('keymirror');

var wifiStatus = keyMirror({
    SLEEPING: null,
    MONITORING: null,
    RECORDING: null
});

var quipuKeys = {};

quipuKeys['NODATA'] = null;
quipuKeys['GPRS'] = null;
quipuKeys['EDGE'] = null;
quipuKeys['3G'] = null;
quipuKeys['H/H+'] = null;

var quipuStatus = keyMirror(quipuKeys);

var bluetoothStatus = keyMirror({
    uninitialized: null,
     initialized: null,
     recording: null
});

module.exports = {
    wifiStatus: wifiStatus,
    quipuStatus: quipuStatus,
    bluetoothStatus: bluetoothStatus
};

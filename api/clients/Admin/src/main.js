'use strict';

var React = require('react');
var io = require('socket.io-client');

var Application = React.createFactory(require('./Components/Application.js'));

var resetUpdate = require('../../_common/js/resetUpdate.js');

var prepareAPI = require('../../../../tools/prepareAPI.js');
var sendReq = require('../../../../tools/sendReq.js');
var makeMap = require('../../../../tools/makeMap.js');

var PRIVATE = require('../../../../PRIVATE/secret.json');

var dbStatusMap = require('./dbStatusMap.js');

var socket = io();

var errlog = console.error.bind(console);

var HOUR = 1000 * 60 * 60;

var topLevelStore = {
    sensorMap: undefined,
    placeMap: undefined,
    onChangePlace: updatePlaceInDb,
    onChangeSensor: updateSensorInDb,
    onCreatePlace: createPlaceInDb,
    onRemovePlace: deletePlaceFromDb,
    onRemoveSensor: deleteSensorFromDb,
    onCreateSensor: createSensorInDb,
    sendCommand: sendCommand
};

// this is used to parse the url and get the secret tocken so admin can call the api
var match,
    pl     = /\+/g,  // Regex for replacing addition symbol with a space
    search = /([^&=]+)=?([^&]*)/g,
    query  = window.location.search.substring(1);

function decode(s) { return decodeURIComponent(s.replace(pl, ' ')); }


var urlParams = {};
while ((match = search.exec(query)))
   urlParams[decode(match[1])] = decode(match[2]);


var api = prepareAPI(sendReq, '', urlParams.s);

function render(){
    React.render(new Application(topLevelStore), document.getElementById("reacthere"));
}

function updatePlaceInDb(datas) {

    console.log('PLACE datas', datas);

    var objs = datas.map(function (data){
        var delta = {};
        delta[data.field] = data.value;

        var obj = {
            id: data.id,
            delta: delta
        };
        return obj;
    });

    var queryP = objs.map(function (obj) {
        return api.updatePlace(obj);
    });

    Promise.all(queryP)
    .then(function() {
        console.log('Places database updated successfully (updatePlaceDb)');
        refreshData();
    })
    .catch(function(err){
        console.log('Places database didn\'t update correctly (updatePlaceDb)', err);
        refreshData();
    });
}


function updateSensorInDb(datas) {

    console.log('SENSOR datas', datas);

    var objs = datas.map(function (data){
        var delta = {};
        delta[data.field] = data.value;

        var obj = {
            sim: data.sim,
            delta: delta
        };
        return obj;
    });

    var queryPs = objs.map(function (obj) {
        return api.updateSensor(obj);
    });
    // console.log("queryP", queryP);
    return Promise.all(queryPs)
    .then(function() {
        // console.log("results", results);
        console.log('Sensor database updated successfully (updateSensorDb)');
        refreshData();
    })
    .catch(function(err){
        console.log('Sensor database didn\'t update correctly (updateSensorDb)', err);
        refreshData();
    });
}

function createPlaceInDb(data) {

    console.log('createPLACE data', data);

    api.createPlace(data)
    .then(function() {
        console.log('Places database created successfully (createPlaceDb)');
        refreshData();
    })
    .catch(function(err){
        console.log('Places database didn\'t create correctly (createPlaceDb)', err);
        refreshData();
    });
}

function deletePlaceFromDb(data) {

    // Queries to uninstall ants from place
    var queryP = updateSensorInDb(data.ants);

    queryP
    .then(function() {
        console.log('Ants uninstall successfull');
        return api.deletePlace(data.placeId);
    })
    .then(function() {
        console.log('Place deleted successfully');
        refreshData();
    })
    .catch(function(err){
        console.log('Place didn\'t delete correctly', err);
        refreshData();
    });
}

function deleteSensorFromDb(data) {

    console.log('deleteSensor data', data);

    api.deleteSensor(data.sim)
    .then(function() {
        console.log('Sensor deleted successfully');
        refreshData();
    })
    .catch(function(err){
        console.log('Sensor didn\'t delete correctly', err);
        refreshData();
    });
}

function createSensorInDb(data) {

    console.log('createSensor data', data);

    api.createSensor(data)
    .then(function() {
        console.log('Sensor database created successfully (createSensorDb)');
        refreshData();
    })
    .catch(function(err){
        console.log('Sensor database didn\'t create correctly (createSensorDb)', err);
        refreshData();
    });
}

var updatingID;

function refreshData(){
    
    console.log('Refresh data');

    var placesP = api.getAllPlacesInfos();
    var sensorsP = api.getAllSensors();

    Promise.all([placesP, sensorsP])
    .then(function(results){

        var places = results[0];
        var sensors = results[1];

        // console.log('places', places);
        // console.log('sensors', sensors);

        if (places){
            // sorting places alphabetically
            places.sort(function(a, b){
                return a.name > b.name ? 1 : -1;
            });
            // console.log('places', results[0]);

            var placeMap = makeMap(places, 'id');

            // establish set of sensors id
            placeMap.forEach(function(place){
                if (place.sensor_ids[0] !== null)
                    place.sensor_ids = new Set(place.sensor_ids);
                else
                    place.sensor_ids = new Set();
            });

            topLevelStore.placeMap = placeMap;
        }
        
        if (sensors){
            // sorting sensors by id
            sensors.sort(function(a, b){
                return a.id > b.id ? 1 : -1;
            });
            
            var sensorMap = makeMap(sensors, 'id');
            
            topLevelStore.sensorMap = sensorMap;

            var measurementsPs = [];

            sensorMap.forEach(function (sensor){
                sensor.outputs = makeMap(sensor.outputs, 'type');

                if (sensor.installed_at) {
                    measurementsPs.push(new Promise(function (resolve) {
                        api.measurementsPlaces({ids: [sensor.installed_at], types: ['wifi']})
                        .then(function (measurements) {

                            // check last time the sensor was active
                            if (measurements && measurements.length){

                                sensor.lastMeasurementDate = measurements[measurements.length - 1].date;

                                var wasUpdatedRecently = new Date().getTime() - new Date(sensor.updated_at).getTime() <= 12 * HOUR;
                                var receivedMeasurementRecently = new Date().getTime() - new Date(sensor.lastMeasurementDate || 0).getTime() <= 12 * HOUR;

                                var isConnected = wasUpdatedRecently || receivedMeasurementRecently;
                
                                if (!isConnected){
                                    sensor.client_status = 'disconnected';
                                    sensor.outputs.forEach(function(output){
                                        output.status = 'NODATA';
                                    });
                                }
                            }
                            else
                                sensor.lastMeasurementDate = '';

                            resolve();
                        })
                        .catch(function (err) {
                            console.log('error :', err);
                            resolve(); // We can't just call reject and stop the refreshing of the page
                        });
                    }));
                }

                sensor.client_status = dbStatusMap.get(sensor.client_status.toLowerCase());
            });

            Promise.all(measurementsPs)
            .then(function () {
                // change updating status
                if (updatingID) {
                    var updatingAnt = topLevelStore.sensorMap.get(updatingID);

                    updatingAnt.isUpdating = true;

                    updatingID = undefined;

                    setTimeout(function(){
                        resetUpdate(updatingAnt);
                        render();
                    }, 500);
                }
                render();

            })
            .catch(function (err) {
                console.log('An error happened :', err);
            });
        }
        else
            render();
    })
    .catch(errlog);
}

function sendCommand(command, selectedAntSet){
    if (command.length > 0 && selectedAntSet.size > 0){
        var sims = [];
        selectedAntSet.forEach(function(id){
            sims.push(topLevelStore.sensorMap.get(id).sim);
        });

        socket.emit('cmd', {
            token: PRIVATE.cmd_token,
            cmd: {
                command: command,
                to: sims
            }
        });

        console.log('Sending command', command, ' to ', sims.join(' '));

        // Update sensor's config if needed

        var value;
        var field;
        var toUpdate = [];

        if (command.match(/changeperiod (\d{1,5})/)) {
            field = 'period';
            value = parseInt(command.match(/changeperiod (\d{1,5})/)[1]);
        }
        else if (command.match(/changestarttime (\d{1,2})/)) {
            field = 'start_hour'; // hour, not time ... That's tricky
            var tmpStart = parseInt(command.match(/changestarttime (\d{1,2})/)[1]);

            if (tmpStart >= 0 && tmpStart < 24)
                value = tmpStart;
        }
        else if (command.match(/changestoptime (\d{1,2})/)) {
            field = 'stop_hour';
            var tmpStop = parseInt(command.match(/changestoptime (\d{1,2})/)[1]);

            if (tmpStop >= 0 && tmpStop < 24)
                value = tmpStop;
        }
        // fill toUpdate with everything that needs update
        sims.forEach(function(sim){
            toUpdate.push({
                sim: sim,
                value: value,
                field: field
            });

            toUpdate.push({
                sim: sim,
                field: 'latest_input',
                value: command.split(' ')[0]
            });

            toUpdate.push({
                sim: sim,
                field: 'latest_output',
                value: '  '
            });
        });
        console.log('toUpdate', toUpdate, toUpdate.length);
        // update everything
        updateSensorInDb(toUpdate);
    }
    
}



// Initial rendering
refreshData();

socket.on('status', function (msg) {

    // GET UPDATING SENSOR ID
    var id = msg.sensorId;
    console.log('UPDATING STATUS', id);
    
    updatingID = id;
    refreshData();
});

socket.on('data', function (msg) {

    // GET UPDATING SENSOR ID
    console.log('RECEIVING DATA', msg);
    
    refreshData();
});

socket.on('image', function (msg) {

    console.log('RECEIVING image');
    document.getElementById("webcam").src = "data:image/jpg;base64," + msg;
});

'use strict';

var React = require('react');
var io = require('socket.io-client');

var Application = React.createFactory(require('./Components/Application.js'));

var makeMap = require('../../_common/js/makeMap.js');
var resetUpdate = require('../../_common/js/resetUpdate.js');

var prepareAPI = require('../../../../tools/prepareAPI.js');
var sendReq = require('../../../../tools/sendReq.js');

var api = prepareAPI(sendReq);

console.log('api', api);

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

function render(){
    React.render(new Application(topLevelStore), document.body);
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
        refreshView();
    })
    .catch(function(err){
        console.log('Places database didn\'t update correctly (updatePlaceDb)', err);
        refreshView();
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
        refreshView();
    })
    .catch(function(err){
        console.log('Sensor database didn\'t update correctly (updateSensorDb)', err);
        refreshView();
    });
}

function createPlaceInDb(data) {

    console.log('createPLACE data', data);

    api.createPlace(data)
    .then(function() {
        console.log('Places database created successfully (createPlaceDb)');
        refreshView();
    })
    .catch(function(err){
        console.log('Places database didn\'t create correctly (createPlaceDb)', err);
        refreshView();
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
        refreshView();
    })
    .catch(function(err){
        console.log('Place didn\'t delete correctly', err);
        refreshView();
    });
}

function deleteSensorFromDb(data) {

    console.log('deleteSensor data', data);

    api.deleteSensor(data.sim)
    .then(function() {
        console.log('Sensor deleted successfully');
        refreshView();
    })
    .catch(function(err){
        console.log('Sensor didn\'t delete correctly', err);
        refreshView();
    });
}

function createSensorInDb(data) {

    console.log('createSensor data', data);

    api.createSensor(data)
    .then(function() {
        console.log('Sensor database created successfully (createSensorDb)');
        refreshView();
    })
    .catch(function(err){
        console.log('Sensor database didn\'t create correctly (createSensorDb)', err);
        refreshView();
    });
}

var updatingID;

function refreshView(){
    //dsds
    var placesP = api.getAllPlacesInfos();
    var sensorsP = api.getAllSensors();

    Promise.all([placesP, sensorsP])
    .then(function(results){

        var places = results[0];
        var sensors = results[1];

        console.log('places', places);
        console.log('sensors', sensors);

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
                else{
                    place.sensor_ids = new Set();
                }     
            });

            topLevelStore.placeMap = placeMap;
        }
        
        if (sensors){
            // sorting sensors by id
            sensors.sort(function(a, b){
                return a.id > b.id ? 1 : -1;
            });
            
            var sensorMap = makeMap(sensors, 'id');
            console.log('sensorMap', sensorMap);

            // transform dbStatus to constants
            sensorMap.forEach(function(sensor){
                sensor.quipu_status = sensor.quipu_status ? dbStatusMap.get(sensor.quipu_status.toLowerCase()) : '';
                sensor.wifi_status = sensor.wifi_status ? dbStatusMap.get(sensor.wifi_status) : '';
                sensor.blue_status = sensor.blue_status ? dbStatusMap.get(sensor.blue_status) : '';
            });

            topLevelStore.sensorMap = sensorMap;

            console.log('sensorMap', sensorMap);

            var measurementsPs = [];

            sensorMap.forEach(function (sensor){
                var isConnected = new Date().getTime() - new Date(sensor.updated_at).getTime() <= 12 * HOUR ||
                                  new Date().getTime() - new Date(sensor.lastMeasurementDate || 0).getTime() <= 12 * HOUR;
                sensor.quipu_status = isConnected ? sensor.quipu_status : 'DISCONNECTED';

                if (sensor.installed_at) {
                    measurementsPs.push(new Promise(function (resolve) {
                        api.getPlaceMeasurements({id: sensor.installed_at})
                        .then(function (measurements) {

                            if (measurements && measurements.length)
                                sensor.lastMeasurementDate = measurements[measurements.length - 1].measurement_date;
                            resolve();
                        })
                        .catch(function (err) {
                            console.log('error :', err);
                            resolve(); // We can't just call reject and stop the refreshing of the page
                        });
                    }));
                }
            });

            Promise.all(measurementsPs)
            .then(function () {
                // change updating status
                if (updatingID) {
                    var updatingAnt = topLevelStore.sensorMap.get(updatingID);

                    updatingAnt.isUpdating = true;

                    updatingID = undefined;
                    console.log('updatingAnt', updatingAnt.isUpdating);

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
        render();
    })
    .catch(errlog);
}

function sendCommand(command, selectedAntSet){
    var antSims = [];
    selectedAntSet.forEach(function(id){
        antSims.push(topLevelStore.sensorMap.get(id).sim);
    });

    socket.emit('cmd', {
        command: command,
        to: antSims
    });

    console.log('Sending command', command, ' to ', antSims.join(' '));

    // Update last command

    updateSensorInDb(antSims.map(function (sim) {
        return {
            sim: sim,
            field: 'latest_input',
            value: command.split(' ')[0]
        };
    }));

    updateSensorInDb(antSims.map(function (sim) {
        return {
            sim: sim,
            field: 'latest_output',
            value: '  '
        };
    }));


    // Update sensor's config if needed

    var sims = antSims;
    var value;
    var field;

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
    else // send to nobody
        sims = [];

    // update everybody

    updateSensorInDb(sims.map(function (sim) {
        return {
            sim: sim,
            value: value,
            field: field
        };
    }));

    // sims.forEach(function (sim) {
    //     updateSensorInDb([{
    //         sim: sim,
    //         delta: delta
    //     }]);
    // });
}



// Initial rendering
refreshView();

// THIS WILL BE NEEDED WHEN QUIPU SIGNAL IS INCORPORATED INTO DATA MSGS
// socket.on('data', function (msg){
//     var id = msg.socketMessage.sensor_id;
//     var signal = msg.socketMessage.quipu.signal;

//     var updatingAnt = topLevelStore.ants.get(id);
//     updatingAnt.signal = signal;

//     render();
// });

socket.on('status', function (msg) {

    // GET UPDATING SENSOR ID
    var id = msg.sensorId;
    console.log('UPDATING STATUS', id);
    
    updatingID = id;
    refreshView();
});

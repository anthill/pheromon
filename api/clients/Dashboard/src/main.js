'use strict';

var React = require('react');
var io = require('socket.io-client');

var Application = React.createFactory(require('./Components/Application.js'));

var prepareAPI = require('../../../../tools/prepareAPI.js');
var sendReq = require('../../../../tools/sendReq.js');
var makeMap = require('../../../../tools/makeMap.js');

var api = prepareAPI(sendReq);

var errlog = console.error.bind(console);

var PRIVATE = require('../../../../PRIVATE/mapbox.json');

var START_COORDS = [16.1496297,-61.39705];

function safeMax(safeInt, unsafeInt) {
    return unsafeInt | 0 === unsafeInt ? Math.max(safeInt, unsafeInt) : safeInt;
}

// Get the day in the URL (EU notation)
var day = location.search.match(/[\? | \?.*&+]day=(\d\d)\/(\d\d)\/(\d\d\d\d)/);
day = day ? day[2] + '/' + day[1] + '/' + day[3] : undefined;
day = new Date(day).toString() !== 'Invalid Date' ? day : undefined;

var topLevelStore = {
    day: day,
    mapBoxToken: PRIVATE.token,
    mapId: PRIVATE.map_id,
    mapCenter: START_COORDS,
    placeMap: undefined,
    selectedPlaceMap: new Map(),
    updatingIDs: [],
    measurementsPlaces: function(place, types){
        api.measurementsPlaces({ids: [place.id], types: types})
        .then(function(measurements){
            console.log('place measurements', place, measurements);
            
            // sort by asc time in case it's not already thus sorted
            measurements.sort(function(m1, m2){
                return new Date(m1.date).getTime() - new Date(m2.date).getTime();
            });
            // place.measurements format is : [{date: Date, value: Int}, {date: Date, value: Int}, ...]
            place.measurements = measurements.map(function (measurement) {
                return ({
                    date: measurement.date,
                    value: measurement.value
                });
            });
            topLevelStore.selectedPlaceMap.set(place.id, place);
            render();
        })
        .catch(errlog);
    }
};

function render(){
    React.render(new Application(topLevelStore), document.body);
}

// Initial rendering
render();

// Render again when receiving places from API
api.placesLatestMeasurement('sismic')
    .then(function(places){
        console.log('places', places);

        topLevelStore.placeMap = makeMap(places, 'id');
        render();
    })
    .catch(errlog);

var socket = io();

socket.on('data', function (measurement) {

    // GET DATA
    var id = measurement.installed_at;

    var value = measurement.value.x;
    var date = measurement.date;
    
    // GET PLACE
    var place = topLevelStore.placeMap.get(id);
    
    place.max = safeMax(place.max, value);
    place.latest = value;

    // place.measurements format is : [{date: Date, value: Int}, {date: Date, value: Int}, ...]
    if (place.measurements) {
    // UPDATE CURVE
        place.measurements.push({
            date: date,
            value: value
        });
    }

    topLevelStore.updatingIDs.push(id);

    render();

    setTimeout(function(){
        topLevelStore.updatingIDs = [];
        render();
    }, 4000);

});

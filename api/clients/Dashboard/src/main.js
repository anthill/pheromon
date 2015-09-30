'use strict';

var React = require('react');
var io = require('socket.io-client');

var Application = React.createFactory(require('./Components/Application.js'));

var prepareAPI = require('../../../../tools/prepareAPI.js');
var sendReq = require('../../../../tools/sendReq.js');

var api = prepareAPI(sendReq);

var makeMap = require('../../_common/js/makeMap.js');

var errlog = console.error.bind(console);

var PRIVATE = require('../../../../PRIVATE.json');

var BORDEAUX_COORDS = [44.84, -0.57];

// Get the day in the URL
var day = location.search.match(/[\? | \?.*&+]day=(\d\d)\/(\d\d)\/(\d\d\d\d)/);
day = day ? day[2] + '/' + day[1] + '/' + day[3] : undefined;
day = new Date(day).toString() !== 'Invalid Date' ? day : undefined;

var topLevelStore = {
    day: day,
    mapBoxToken: PRIVATE.mapbox_token,
    mapId: PRIVATE.map_id,
    mapCenter: BORDEAUX_COORDS,
    placeMap: undefined,
    selectedPlaceMap: new Map(),
    updatingIDs: [],
    getPlaceMeasurements: function(place){
        api.getPlaceMeasurements(place.id)
            .then(function(measurements){
                console.log('place measurements', place, measurements);
                
                // sort by asc time in case it's not already thus sorted
                measurements.sort(function(m1, m2){
                    return new Date(m1.date).getTime() - new Date(m2.date).getTime();
                });
            
                place.measurements = measurements;
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

// Render again when receiving recyclingCenters from API
api.getLiveAffluence()
    .then(function(places){
        console.log('places', places);

        topLevelStore.placeMap = makeMap(places, 'id');
        render();
    })
    .catch(errlog);

var socket = io();

socket.on('data', function (results) {

    results.forEach(function(result){
        // GET DATA
        var id = result.data.measurement.installed_at;

        var value = result.data.measurement.value.length;
        var date = result.data.measurement.date;

        // console.log('results', value);
        
        // GET PLACE
        var place = topLevelStore.placeMap.get(id);
        
        place.max = Math.max(place.max, value);
        place.latest = value;

        if (place.measurements)
        // UPDATE CURVE
            place.measurements.push({
                date: date,
                value: value
            });

        topLevelStore.updatingIDs.push(id);
    });

    render();

    setTimeout(function(){
        topLevelStore.updatingIDs = [];
        render();
    }, 200);

});

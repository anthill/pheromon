"use strict";

var decl = require('./management/declarations.js');
var databaseP = require('./management/databaseClientP');

var places = decl.places;
var sensor = decl.sensors;
var measurement = decl.measurements;

module.exports = {
    Places: require('./models/places.js'),
    Sensors: require('./models/sensors.js'),
    Measurements: require('./models/measurements.js'),
    complexQueries: {
        currentPlaceAffluences: function(){
            return databaseP.then(function(db) {
                /*
                    For each place, get the last measurement date
                */
                var latestPlaceMeasurementDate = places
                    .subQuery('latest_recycling_center_measurement_date')
                    .select(
                        places.id,
                        measurement.date.max().as('last_date')
                    )
                    .from(
                        places
                            .join(sensor
                                .join(measurement)
                                .on(sensor.sim.equals(measurement.sensor_sim)))
                            .on(places.id.equals(sensor.installed_at))
                    )
                    .group(places.id, sensor.sim);
                
                /*
                    For each recycling center, get the measurement value associated to the last measurement date
                */
                var latestPlaceMeasurementValue = places
                    .subQuery('latest_recycling_center_measurement_value')
                    .select(
                        places.id,
                        measurement
                            .literal('array_length(measurements.value, 1)')
                            .as('latest')
                    )
                    .from(
                        places
                            .join(sensor
                                .join(measurement)
                                .on(sensor.sim.equals(measurement.sensor_sim)))
                            .on(places.id.equals(sensor.installed_at))
                            .join(latestPlaceMeasurementDate)
                            .on(places.id.equals(latestPlaceMeasurementDate.id).and(
                                latestPlaceMeasurementDate.last_date.equals(measurement.date)
                            ))
                    );
                
                /*
                    For each recycling center, get the maximum measurement (and recycling center infos)
                    TODO restrict maximum to the last few months
                */
                var maxMeasurementPerPlace = places
                    .subQuery('max_measurement_per_recycling_center')
                    .select(
                        places.id, places.name, places.lat, places.lon,
                        'max(array_length(measurements.value, 1))'
                    )
                    .from(
                        places
                            .join(sensor
                                .join(measurement)
                                .on(sensor.sim.equals(measurement.sensor_sim)))
                            .on(places.id.equals(sensor.installed_at))
                    )
                    .group(places.id, sensor.sim);
                
                /*
                    For each recycling center, get
                    * recycling center infos (long lat)
                    * maximum number of signals
                    * latest measured number of signals
                */
                var query = places
                    .select('*')
                    .from(maxMeasurementPerPlace
                        .join(latestPlaceMeasurementValue)
                        .on(maxMeasurementPerPlace.id.equals(latestPlaceMeasurementValue.id))
                    )
                    .toQuery();
                
                // console.log('currentPlaceAffluences query', query);

                return new Promise(function (resolve, reject) {
                    db.query(query, function (err, result) {
                        if (err) reject(err);
                        else resolve(result.rows);
                    });
                });
            });
            
        },
        
        getPlaceMeasurements: function(placeId){
            return databaseP.then(function(db){

                var query = sensor
                    .select(
                        sensor.sim,
                        measurement.date,
                        measurement
                            .literal('array_length(measurements.value, 1)')
                            .as('entry'),
                        measurement.value
                    )
                    .from(
                        sensor
                            .join(measurement)
                            .on(sensor.sim.equals(measurement.sensor_sim))
                    )
                    .where(sensor.installed_at.equals(placeId))
                    .toQuery();
                
                return new Promise(function (resolve, reject) {
                    db.query(query, function (err, result) {
                        if (err) reject(err);
                        else resolve(result.rows);
                    });
                });
            })
        },

        getSensorMeasurements: function(sim){
            return databaseP.then(function(db){

                var query = sensor
                    .select(
                        sensor.sim,
                        measurement.date,
                        measurement
                            .literal('array_length(measurements.value, 1)')
                            .as('entry'),
                        measurement.value
                    )
                    .where(sensor.sim.equals(sim))
                    .from(
                        sensor
                            .join(measurement)
                            .on(sensor.sim.equals(measurement.sensor_sim))
                    )
                    .toQuery();
                
                return new Promise(function (resolve, reject) {
                    db.query(query, function (err, result) {
                        if (err) reject(err);
                        else resolve(result.rows);
                    });
                });
            })
        },

        getAllPlacesInfos: function() {
            return databaseP.then(function (db) {
            
                var query = places
                    .select(
                        sensor.literal('array_agg(sensors.sim)').as('sensor_sims'), 
                        places.star()
                    )
                    .from(
                        places
                        .leftJoin(sensor)
                        .on(places.id.equals(sensor.installed_at))
                    )
                    .group(places.id)
                    .toQuery();

                return new Promise(function (resolve, reject) {
                    db.query(query, function (err, result) {
                        if (err) reject(err);

                        else resolve(result.rows);
                    });
                });
            })
            .catch(function(err){
                console.log('ERROR in getAllPlacesInfos', err);
            });        
        }
    }
};

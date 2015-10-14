'use strict';

var decl = require('./management/declarations.js');
var databaseP = require('./management/databaseClientP');

var places = decl.places;
var sensor = decl.sensors;
var measurement = decl.measurements;
var output = decl.outputs;

var toExport = {
    Places: require('./models/places.js'),
    Sensors: require('./models/sensors.js'),
    Measurements: require('./models/measurements.js'),
    complexQueries: {
        currentPlaceAffluences: function(){
            return databaseP.then(function(db) {
                var place_sensor_output_measurement = places
                    .join(sensor
                        .join(output
                            .join(measurement)
                            .on(measurement.output_id.equals(output.id)))
                        .on(output.sensor_id.equals(sensor.id))
                    .on(
                        places.id.equals(sensor.installed_at)
                    ));

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
                        place_sensor_output_measurement
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
                        place_sensor_output_measurement
                            .join(latestPlaceMeasurementDate)
                            .on(places.id.equals(latestPlaceMeasurementDate.id).and(
                                latestPlaceMeasurementDate.last_date.equals(measurement.date)
                            )));

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
                                .join(output
                                    .join(measurement)
                                    .on(measurement.output_id.equals(output.id)))
                                .on(output.sensor_id.equals(sensor.id))
                            .on(places.id.equals(sensor.installed_at))))
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

        getPlaceMeasurements: function(placeId, types){
            return databaseP.then(function(db){

                var query = sensor
                    .select(
                        sensor.sim,
                        measurement.date,
                        measurement
                            .literal('array_length(measurements.value, 1)')
                            .as('entry'),
                        measurement.value,
                        output.type
                    )
                    .where(sensor.installed_at.equals(placeId), output.type.in(types))
                    .from(
                        sensor
                            .join(output
                                .join(measurement)
                                .on(measurement.output_id.equals(output.id)))
                            .on(output.sensor_sim.equals(sensor.sim)))
                    .toQuery();

                return new Promise(function (resolve, reject) {
                    db.query(query, function (err, result) {
                        if (err) reject(err);
                        else resolve(result.rows);
                    });
                });
            });
        },

        getSensorMeasurements: function(sim, types){
            return databaseP.then(function(db){

                var query = sensor
                    .select(
                        sensor.sim,
                        measurement.date,
                        output.type,
                        measurement
                            .literal('array_length(measurements.value, 1)')
                            .as('entry'),
                        measurement.value
                    )
                    .where(sensor.sim.equals(sim), output.type.in(types))
                    .from(
                        sensor
                            .join(output
                                .join(measurement)
                                .on(measurement.output_id.equals(output.id)))
                            .on(output.sensor_id.equals(sensor.id)))
                    .toQuery();

                return new Promise(function (resolve, reject) {
                    db.query(query, function (err, result) {
                        if (err) reject(err);
                        else
                            resolve(result.rows);
                    });
                });
            });
        },

        getAllPlacesInfos: function() { // gets the place with the installed sensors
            return databaseP.then(function (db) {

                var query = places
                    .select(
                        sensor.literal('array_agg(sensors.id)').as('sensor_ids'),
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

module.exports = toExport;

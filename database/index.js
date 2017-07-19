"use strict";

var decl = require("./management/declarations.js");
var databaseP = require("./management/databaseClientP");

var place = decl.places;
var sensor = decl.sensors;
var measurement = decl.measurements;
var output = decl.outputs;

var toExport = {
    Places: require("./models/places.js"),
    Sensors: require("./models/sensors.js"),
    Measurements: require("./models/measurements.js"),
    complexQueries: {
        placeLatestMeasurement: function(placeId, type){
            return databaseP.then(function(db) {

                var fullJoin = place
                    .join(sensor
                        .join(output
                            .join(measurement)
                            .on(measurement.output_id.equals(output.id))
                        )
                        .on(output.sensor_id.equals(sensor.id).and(
                            output.type.equals(type)
                        )))
                    .on(place.id.equals(sensor.installed_at));

                /*
                    For each place, get the last measurement date
                */

                var latestPlaceMeasurementDate = place
                    .subQuery("latest_measurement_date")
                    .select(
                        place.id,
                        measurement.date.max().as("last_date")
                    )
                    .from(fullJoin)
                    .where(place.id.equals(placeId))
                    .group(place.id);

                /*
                    For each place, get the measurement value associated to the last measurement date
                */
                
                var latestPlaceMeasurementValue = place
                    .subQuery("latest_measurement_value")
                    .select(
                        place.id,
                        output.type,
                        measurement
                            .literal("measurements.value")
                            .as("latest"),
                        measurement.date.as("last_date")
                    )
                    .from(fullJoin
                        .join(latestPlaceMeasurementDate)
                        .on(place.id.equals(latestPlaceMeasurementDate.id).and(
                            latestPlaceMeasurementDate.last_date.equals(measurement.date)
                        )));

                /*
                    For each place, get the maximum measurement (and place infos)
                    TODO restrict maximum to the last few months
                */
                var maxMeasurementPerPlace = place
                    .subQuery("max_measurement_per_place")
                    .select(
                        place.id, place.name, place.lat, place.lon,
                        "max(GREATEST(measurements.value,01))"
                    )
                    .from(fullJoin)
                    .where(place.id.equals(placeId))
                    .group(place.id);

                /*
                    For each place, get
                    * place infos (long lat)
                    * maximum number of signals
                    * latest measured number of signals
                */
                var query = place
                    .select("*")
                    .from(maxMeasurementPerPlace
                        .join(latestPlaceMeasurementValue)
                        .on(maxMeasurementPerPlace.id.equals(latestPlaceMeasurementValue.id))
                    )
                    .toQuery();

                // console.log("placeLatestMeasurement query", query);

                return new Promise(function (resolve, reject) {
                    db.query(query, function (err, result) {
                        if (err) reject(err);
                        else resolve(result.rows[0]);
                    });
                });
            });
        },
        placesLatestMeasurement: function(type){
            return databaseP.then(function(db) {

                var fullJoin = place
                    .join(sensor
                        .join(output
                            .join(measurement)
                            .on(measurement.output_id.equals(output.id))
                        )
                        .on(output.sensor_id.equals(sensor.id).and(
                            output.type.equals(type)
                        )))
                    .on(place.id.equals(sensor.installed_at));
                /*
                    For each place, get the last measurement date
                */
                var latestPlaceMeasurementDate = place
                    .subQuery("latest_measurement_date")
                    .select(
                        place.id,
                        measurement.date.max().as("last_date")
                    )
                    .from(fullJoin)
                    .group(place.id);

                /*
                    For each place, get the measurement value associated to the last measurement date
                */
                
                var latestPlaceMeasurementValue = place
                    .subQuery("latest_measurement_value")
                    .select(
                        place.id,
                        output.type,
                        measurement
                            .literal("measurements.value")
                            .as("latest"),
                        measurement.date.as("last_date")
                    )
                    .from(fullJoin
                        .join(latestPlaceMeasurementDate)
                        .on(place.id.equals(latestPlaceMeasurementDate.id).and(
                            latestPlaceMeasurementDate.last_date.equals(measurement.date)
                        )));

                /*
                    For each place, get the maximum measurement (and place infos)
                */
                var maxMeasurementPerPlace = place
                    .subQuery("max_measurement_per_place")
                    .select(
                        place.id, place.name, place.lat, place.lon,
                        "max(GREATEST(measurements.value,0))"
                    )
                    .from(fullJoin)
                    .group(place.id);

                /*
                    For each place, get
                    * place infos (long lat)
                    * maximum number of signals
                    * latest measured number of signals
                */
                var query = place
                    .select("*")
                    .from(maxMeasurementPerPlace
                        .join(latestPlaceMeasurementValue)
                        .on(maxMeasurementPerPlace.id.equals(latestPlaceMeasurementValue.id))
                    )
                    .toQuery();

                // console.log("currentPlaceAffluences query", query);

                return new Promise(function (resolve, reject) {
                    db.query(query, function (err, result) {
                        if (err) reject(err);
                        else resolve(result.rows);
                    });
                });
            });
        },
        sensorsLatestMeasurement: function(sims, type){
            return databaseP.then(function(db) {

                var fullJoin = sensor
                    .join(output
                        .join(measurement)
                        .on(measurement.output_id.equals(output.id))
                    )
                    .on(output.sensor_id.equals(sensor.id).and(
                        output.type.equals(type)
                    ));
                /*
                    For each sensor, get the last measurement date
                */
                var latestSensorMeasurementDate = sensor
                    .subQuery("latest_sensor_measurement_date")
                    .select(
                        sensor.id,
                        measurement.date.max().as("last_date")
                    )
                    .from(fullJoin)
                    .where(sensor.sim.in(sims))
                    .group(sensor.id);

                /*
                    For each sensor, get the measurement value associated to the last measurement date
                */
                
                var latestSensorMeasurementValue = sensor
                    .subQuery("latest_sensor_measurement_value")
                    .select(
                        sensor.id,
                        output.type,
                        measurement
                            .literal("measurements.value")
                            .as("latest"),
                        measurement.date.as("last_date")
                    )
                    .from(fullJoin
                        .join(latestSensorMeasurementDate)
                        .on(sensor.id.equals(latestSensorMeasurementDate.id).and(
                            latestSensorMeasurementDate.last_date.equals(measurement.date)
                        )));

                /*
                    For each sensor, get the maximum measurement
                    TODO restrict maximum to the last few months
                */
                var maxMeasurementPerSensor = sensor
                    .subQuery("max_measurement_per_place")
                    .select(
                        sensor.id, sensor.name, sensor.project, sensor.sim, sensor.period,
                        "max(GREATEST(measurements.value,0))"
                    )
                    .from(fullJoin)
                    .where(sensor.sim.in(sims))
                    .group(sensor.id);

                /*
                    For each sensor, get
                    * sensor infos 
                    * maximum number of signals
                    * latest measured number of signals
                    * latest date measured
                */
                var query = place
                    .select("*")
                    .from(maxMeasurementPerSensor
                        .join(latestSensorMeasurementValue)
                        .on(maxMeasurementPerSensor.id.equals(latestSensorMeasurementValue.id))
                    )
                    .toQuery();

                // console.log("sensorsLatestMeasurement query", query);

                return new Promise(function (resolve, reject) {
                    db.query(query, function (err, result) {
                        if (err) reject(err);
                        else resolve(result.rows);
                    });
                });
            });
        },

        getPlaceMeasurements: function(ids, types, start, end){
            return databaseP.then(function(db){

                // if no dates provided, assume we want all
                var _start = start || new Date("1900-10-15T11:23:19.766Z");
                var _end = end || new Date("2200-10-15T11:23:19.766Z");

                var query = sensor
                    .select(
                        measurement.date,
                        measurement.value,
                        output.type
                    )
                    .where(
                        sensor.installed_at.in(ids),
                        output.type.in(types),
                        measurement.date.between(_start, _end)
                    )
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
                        else resolve(result.rows);
                    });
                });
            });
        },

        getSensorsMeasurements: function(sims, types, start, end){
            return databaseP.then(function(db){

                // if no dates provided, assume we want all
                var _start = start || new Date("1900-10-15T11:23:19.766Z");
                var _end = end || new Date("2200-10-15T11:23:19.766Z");

                var query = sensor
                    .select(
                        sensor.sim,
                        measurement.date,
                        output.type,
                        measurement
                            .literal("measurements.value")
                            .as("entry"),
                        measurement.value
                    )
                    .where(
                        sensor.sim.in(sims), 
                        output.type.in(types),
                        measurement.date.between(_start, _end)
                        )
                    .from(
                        sensor
                            .join(output
                                .join(measurement)
                                .on(measurement.output_id.equals(output.id)))
                            .on(output.sensor_id.equals(sensor.id)))
                    .toQuery();

                // console.log("getSensorsMeasurements query", query);

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

                var query = place
                    .select(
                        sensor.literal("array_agg(sensors.id)").as("sensor_ids"),
                        sensor.literal("array_agg(sensors.sim)").as("sensor_uids"),
                        place.star()
                    )
                    .from(
                        place
                        .leftJoin(sensor)
                        .on(place.id.equals(sensor.installed_at))
                    )
                    .group(place.id)
                    .toQuery();

                return new Promise(function (resolve, reject) {
                    db.query(query, function (err, result) {
                        if (err) reject(err);
                        else resolve(result.rows);
                    });
                });
            })
            .catch(function(err){
                console.log("ERROR in getAllPlacesInfos", err);
            });
        },

        // Returns place measurements of a specified type without any processing.
        getPlaceRawMeasurements: function(id, type, start, end) {
            return databaseP.then(function(db){

                // if no dates provided, assume we want all
                var _start = start || new Date("1900-10-15T11:23:19.766Z");
                var _end = end || new Date("2200-10-15T11:23:19.766Z");

                var query = sensor
                    .select(
                        measurement.created_at.as('date'),
                        measurement.value,
                        output.type
                    )
                    .where(
                        sensor.installed_at.equals(id),
                        output.type.equals(type),
                        measurement.created_at.between(_start, _end)
                    )
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
                        else resolve(result.rows);
                    });
                });
            });

        },

        // Returns sensor measurements of a specified type without any processing.
        getSensorRawMeasurements: function(sim, type, start, end) {
            return databaseP.then(function(db){

                // if no dates provided, assume we want all
                var _start = start || new Date("1900-10-15T11:23:19.766Z");
                var _end = end || new Date("2200-10-15T11:23:19.766Z");

                var query = sensor
                    .select(
                        sensor.sim,
                        output.type,
                        measurement.date,
                        measurement.value
                    )
                    .where(
                        sensor.sim.equals(sim),
                        output.type.equals(type),
                        measurement.date.between(_start, _end)
                        )
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
        }
    }
};

module.exports = toExport;

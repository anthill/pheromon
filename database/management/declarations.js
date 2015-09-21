var sql = require('sql');


exports.lifecycle = sql.define({
	name: 'lifecycle',
	columns: [
		{ name: 'created_at' },
		{ name: 'updated_at' }
	]
});


exports.places = sql.define({
	name: 'places',
	columns: [
		{ name: 'created_at' },
		{ name: 'updated_at' },
		{ name: 'id' },
		{ name: 'name' },
		{ name: 'type' },
		{ name: 'lat' },
		{ name: 'lon' }
	]
});


exports.sensor_measurements = sql.define({
	name: 'sensor_measurements',
	columns: [
		{ name: 'created_at' },
		{ name: 'updated_at' },
		{ name: 'id' },
		{ name: 'sensor_sim' },
		{ name: 'type' },
		{ name: 'measurements' },
		{ name: 'measurement_date' }
	]
});


exports.sensors = sql.define({
	name: 'sensors',
	columns: [
		{ name: 'created_at' },
		{ name: 'updated_at' },
		{ name: 'id' },
		{ name: 'name' },
		{ name: 'installed_at' },
		{ name: 'project' },
		{ name: 'sim' },
		{ name: 'quipu_status' },
		{ name: 'sense_status' },
		{ name: 'latest_input' },
		{ name: 'latest_output' },
		{ name: 'signal' },
		{ name: 'period' },
		{ name: 'start_hour' },
		{ name: 'stop_hour' }
	]
});



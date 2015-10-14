var sql = require('sql');


exports.lifecycle = sql.define({
	name: 'lifecycle',
	columns: [
		{ name: 'created_at' },
		{ name: 'updated_at' }
	]
});


exports.measurements = sql.define({
	name: 'measurements',
	columns: [
		{ name: 'created_at' },
		{ name: 'updated_at' },
		{ name: 'id' },
		{ name: 'output_id' },
		{ name: 'value' },
		{ name: 'date' }
	]
});


exports.outputs = sql.define({
	name: 'outputs',
	columns: [
		{ name: 'created_at' },
		{ name: 'updated_at' },
		{ name: 'id' },
		{ name: 'sensor_id' },
		{ name: 'type' },
		{ name: 'status' }
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
		{ name: 'client_status' },
		{ name: 'signal_status' },
		{ name: 'latest_input' },
		{ name: 'latest_output' },
		{ name: 'period' },
		{ name: 'start_hour' },
		{ name: 'stop_hour' }
	]
});



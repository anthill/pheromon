"use strict";

var database = require('../database');

module.exports = function(app){

	// --------------> sensor
	app.post('/sensor/create', function(req, res){    
	    console.log('creating sensor', req.body);

	    database.Sensors.create(req.body)
	    .then(function(data){
	        debug('Sensor created', data);
	        res.status(201).send(data);
	    })
	    .catch(function(error){
	        res.status(500).send('Couldn\'t create Sensor in database');
	        console.log("error in /sensor/create/", error);
	    });
	});

	app.post('/sensor/update', function(req, res){
	    var id = Number(req.body.id);

	    database.Sensors.update(id, req.body.delta) // req.body.delta : {name,lat,lon}
	    .then(function(data){
	        res.status(200).send(data);
	    })
	    .catch(function(error){
	        res.status(500).send('Couldn\'t update Sensors database');
	        console.log("error in /sensor/update/" + id, error);
	    });
	});

	app.get('/sensor/get/:id', function(req, res){
	    var id = Number(req.params.id);
	    console.log('requesting sensor id', id);

	    database.Sensors.get(id)
	    .then(function(data){
	        // debug('All sensors', data);
	        res.status(200).send(data);
	    })
	    .catch(function(error){
	    	res.status(500).send('Couldn\'t get sensor from database');
	        console.log("error in /sensor/get/" + id, error);
	    });
	});

	app.get('/sensor/getAll', function(req, res){
	    database.Sensors.getAll()
	    .then(function(data){
	        // debug('All sensors', data);
	        res.status(200).send(data);
	    })
	    .catch(function(error){
	    	res.status(500).send('Couldn\'t gett all sensors database');
	        console.log("error in /sensor/getAll: ", error);
	    });
	});

	app.post('/sensor/delete/:id', function(req, res){    
	    var id = Number(req.params.id);
	    console.log('removing sensor id', id);

	    database.Sensors.delete(id)
	    .then(function(data){
	        res.status(200).send(data);
	    })
	    .catch(function(error){
	        res.status(500).send('Couldn\'t delete Sensor from database');
	        console.log("error in /sensor/delete/" + id, error);
	    });
	});

	app.post('/sensor/deleteAll', function(req, res){    
	    console.log('removing all sensors');

	    database.Sensors.deleteAll()
	    .then(function(data){
	        res.status(200).send(data);
	    })
	    .catch(function(error){
	        res.status(500).send('Couldn\'t delete all Sensors from database');
	        console.log("error in /sensor/deleteAll", error);
	    });
	});

	// --------------> place
	app.post('/place/create', function(req, res){    
	    console.log('creating place', req.body);

	    database.Sensors.create(req.body)
	    .then(function(data){
	        debug('Place created', data);
	        res.status(201).send(data);
	    })
	    .catch(function(error){
	        res.status(500).send('Couldn\'t create Place in database');
	        console.log("error in /place/create/" + id, error);
	    });
	});

	app.post('/place/update', function(req, res){
	    var id = Number(req.body.id);

	    database.Places.update(id, req.body.delta) // req.body.delta : {name,lat,lon}
	    .then(function(data){
	        res.status(200).send(data);
	    })
	    .catch(function(error){
	        res.status(500).send('Couldn\'t update Places database');
	        console.log("error in /place/update/" + id, error);
	    });
	});

	app.get('/place/get/:id', function(req, res){
	    var id = Number(req.params.id);
	    console.log('requesting place id', id);

	    database.Places.get(id)
	    .then(function(data){
	        // debug('All places', data);
	        res.status(200).send(data);
	    })
	    .catch(function(error){
	    	res.status(500).send('Couldn\'t get place from database');
	        console.log("error in /place/get/" + id, error);
	    });
	});

	app.get('/place/getAll', function(req, res){
	    database.Places.getAll()
	    .then(function(data){
	        // debug('All places', data);
	        res.status(200).send(data);
	    })
	    .catch(function(error){
	    	res.status(500).send('Couldn\'t get all places from database');
	        console.log("error in /place/getAll: ", error);
	    });
	});

	app.post('/place/delete/:id', function(req, res){    
	    var id = Number(req.params.id);
	    console.log('removing place id', id);

	    database.Places.delete(id)
	    .then(function(data){
	        res.status(200).send(data);
	    })
	    .catch(function(error){
	        res.status(500).send('Couldn\'t delete Place from database');
	        console.log("error in /place/delete/" + id, error);
	    });
	});

	app.post('/place/deleteAll', function(req, res){    
	    console.log('removing all sensors');

	    database.Places.deleteAll()
	    .then(function(data){
	        res.status(200).send(data);
	    })
	    .catch(function(error){
	        res.status(500).send('Couldn\'t delete all Places from database');
	        console.log("error in /place/deleteAll", error);
	    });
	});






	// complex queries

	app.get('/live-affluence', function(req, res){
	    database.complexQueries.currentPlaceAffluences()
        .then(function(data){
            res.status(200).send(data);
        })
        .catch(function(error){
            console.log("error in /live-affluence: ", error);
            res.status(500).send('Couldn\'t get live-affluence database');
        });
	});

	app.get('/place/:id', function(req, res){
	    var id = Number(req.params.id);
	    console.log('requesting place id', id);
	    
	    database.complexQueries.getPlaceMeasurements(id)
	    .then(function(data){
	        res.status(200).send(data);
	    })
	    .catch(function(error){
	    	res.status(500).send('Couldn\'t place measurements from database');
	        console.log("error in /place/'+req.params.id: ", error);
	    });
	});

	app.get('/allPlacesInfos', function(req, res){
	    database.complexQueries.getAllPlacesInfos()
	    .then(function(data){
	        // debug('All places infos', data);
	        res.status(200).send(data);
	    })
	    .catch(function(error){
	    	res.status(500).send('Couldn\'t get all place info from database');
	        console.log("error in /allPlacesInfos: ", error);
	    });
	});

};
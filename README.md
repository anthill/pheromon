# Pheromon

**Pheromon is a open innovation project to deploy, administrate and harvest data from a swarm of sensors**. It has been developped in the scope of project 6element dedicated to waste optimisation **[Learn more](http://ants.builders/pages/6element.html)**).

![Image Alt](https://docs.google.com/drawings/d/1a-9oJr7eGid59iTj12dici8-Qb83j9Y7QbTz34jCo_M/pub?w=960&h=720)

Pheromon communicates with sensors over TCP using MQTT protocol. The MQTT broker dispatches the messages depending on the publish/subscribe status of various clients on various subjects. For example, a meteorological sensor will publish on the topics `rain` and `temperature` while a sensor measuring peoples fluxes will pusblish on `wifidevices` and `bluetoothdevices`. Meanwhile, the admin interface can publish on the `command` topic and sensors subscribed will respond on `status`.

All the messages are persisted in a database that can be queried by a API able to answer queries like "give me all mesaurements of sensor X since Y".

*You can find the source code for sensors in [6brain](https://github.com/anthill/6brain)*


## Quick start :

* Install [docker](https://docs.docker.com/) and [docker-compose](http://docs.docker.com/compose/install/) and check docker daemon (or boot2docker) is running.

* Make sure to have the port 5100 opened on your server.

* clone the repository :

```
git clone git@github.com:anthill/pheromon.git
cd pheromon
```

* Copy / Create the file `core/PRIVATE.json` containing

```
{
    "mapbox_token": ...,
    "map_id": ...,
    "secret": ...,
    "token": ...
}
```
(`secret` is the key needed to access admin commands, mapbox tockens and id are for the map background of the dashboard and `token` is the key to authentify sensors)

* Install dependencies locally (this is mainly to enable gulp and automated lint functionality)

````
npm install
````

* Build container

```
docker-compose -f compose-init-db.yml build
docker-compose -f compose-dev.yml build
```

* Prepare the db : 

```
npm run init-db
```
    *When it says you that the database has been reseted, you can stop it.*


* Launch the containers and the 

```
npm run dev
```

## Initialization sequence 

We don't want sensors to have a manually hard-coded id (for deployment's simplicity) so we use SIM id (queried with AT command):

**Sequence**

- [sensor] when powering up, sensor tries to connect to MQTT broker with authentification token.
- [broker] authenticates sensor.
- [sensor] when authenticated, sensor subscribes to `mySensorSimId` and `all` topics, then sends an empty message on `init/mySensorSimId` topic.
- [maestro] receives message, checks `mySensorSimId` in DB, creates Sensor if needed, and sends back [`init`, `parameters`] on `simId` topic.
- [sensor] receives message, initializes its `parameters` and sends back `initialized` on `status/mySensorSimId/statusType` topic for status update.

## Status update sequence

Each time the sensor's status changes, a message is sent to the maestro to update the DB and react accordingly depending on the situation. Status can be of 3 types:
- `quipu`: state of communication between sensor and kerrigan server
- `wifi`: wifi monitoring state of sensor 
- `blue`: bluetooth monitoring state of sensor

**Sequence**

- [somewhere] something happens that changes the sensor `type` status to `newStatus`.
- [sensor] sends `newStatus` on `status/mySensorSimId/type` topic.
- [maestro] receives message, check `mySensorSimId` in DB, creates Sensor if needed, and updates sensor in DB.

## Measurement push sequence

By default, sensor has measurement capabilities (for wifi and bluetooth). Every `n` minutes, sensor send measurements to kerrigan server to be recorded in DB.

**Sequence**

- [time passing] `n` minutes has passed since last measurement on `measurementType`
- [sensor] wraps collected information into `measurementContent` and sends `measurementContent` on `measurement/mySensorSimId/measurementType` topic.
- [maestro] receives message, check `mySensorSimId` in DB, creates Sensor if needed, and then creates Measurement in DB.

## Command sending sequence
TODO

## Unitary tests

You can run tests in a dedicated docker.

First build the container:
````
docker-compose -f compose-test.yml build
````

Once built, you can use
```
npm run test
````

## Contribute :

* Clone the repository.

* Create a new branch to work in.

* Make a pull request explaining why and what you changed.

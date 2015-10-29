# Pheromon

[![Build Status](https://travis-ci.org/anthill/pheromon.svg)](https://travis-ci.org/anthill/pheromon)

## Overview

**Pheromon is a open innovation project to deploy, administrate and harvest data from a swarm of sensors**. It has been developed in the scope of project 6element dedicated to waste optimisation.

**Learn more about 6element in our [dedicated page](http://ants.builders/pages/6element.html) or in [this Medium article](https://medium.com/ants-blog/6element-534ffbe2a60f)**.

![Image Alt](https://docs.google.com/drawings/d/1a-9oJr7eGid59iTj12dici8-Qb83j9Y7QbTz34jCo_M/pub?w=960&h=720)

Pheromon communicates with sensors over TCP using MQTT protocol. The MQTT broker dispatches the messages depending on the publish/subscribe status of various clients on various subjects. For example, a meteorological sensor will publish on the topics `rain` and `temperature` while a sensor measuring peoples fluxes will publish on `wifidevices` and `bluetoothdevices`. Meanwhile, the admin interface can publish to all sensors on the `all` topic, or to one particular sensor on `mySensorId` topic.
More on the topics later on.

All the messages are persisted in a database that can be queried by a API able to answer queries like "give me all mesaurements of sensor X since Y".

## 6brain

**[6brain](https://github.com/anthill/6brain)** is the sensor counterpart of Pheromon. It is the code you need to have on your sensors so that they can communicate with Pheromon.

## Clients

Two clients are available for now.

The **Dashboard** is useful to visualize the measurements on a map.
![Dashboard](https://docs.google.com/drawings/d/15e3pNNdNSJg61KrjDVDR1zNUwxQwabhA4rs4NJAqo9A/pub?w=960&h=540)

You can also administrate your sensors with the **Admin**.
![Admin](https://drive.google.com/file/d/0B1PNw6hzqx_EeXFfTFlpRkxyd0k/view?usp=sharing)

More on those clients later.

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
    "mapbox_token": ..., // token for your mapbox account
    "map_id": ..., // id of your map background
    "secret": ..., // token you should use to protect the access to your Admin client or database API
    "token": ... // MQTT for the broker to authenticate sensor
}
```

* Install dependencies locally (this is mainly to enable gulp and automated lint functionality)

````
npm install
````

* Build container

```
docker-compose -f compose-init-db-dev.yml build
docker-compose -f compose-dev.yml build
```

* Prepare the db : 

```
npm run init-db-prod
// or if you want to dev
npm run init-db-dev
```

* Launch the containers and the 

```
npm run prod
// or if you want to dev
npm run dev
```

## MQTT
MQTT is the communication protocol between the server and the sensors.

### Elements
The communication protocol is composed of 3 elements:
- **broker**: authenticates clients and relays messages
- **sensor**: client
- **maestro**: client, on the kerrigan server

### Available Topics up to now:
*From* **sensor** *to* **maestro**:
- `init/mySensorSimId`, when sensor needs to initialize. There is no content.
- `status/mySensorSimId/type`, when a sensor status updates. The content is a string describing the actual status.
- `measurement/mySensorSimId/type`, when a measurement is sent from sensor. The content is an array of measurements.
- `cmdResult/mySensorSimId`, when a sensor processed a command sent from maestro. The content is a string describing the output of the command.

*From* **maestro** *to* **sensor**:
- `mySensorSimId`, when maestro sends command to sensor. The content is a string of the command.
- `all`, when maestro sends command to all registered sensors. The content is a string of the command.

### Initialization sequence 

We don't want sensors to have a manually hard-coded id (for deployment's simplicity) so we use SIM id (queried with AT command):

**Sequence**

- [sensor] when powering up, sensor tries to connect to MQTT broker with authentification token.
- [broker] authenticates sensor.
- [sensor] when authenticated, sensor subscribes to `mySensorSimId` and `all` topics, then sends an empty message on `init/mySensorSimId` topic.
- [maestro] receives message, checks `mySensorSimId` in DB, creates Sensor if needed, and sends back [`init`, `parameters`] on `simId` topic.
- [sensor] receives message, initializes its `parameters` and routines.

### Status update sequence

Each time the sensor's status changes, a message is sent to the maestro to update the DB and react accordingly depending on the situation. Status can be of 3 types:
- `client`: state of communication between sensor and kerrigan server
- `signal`: power of signal between sensor and kerrigan server
- `wifi`: wifi monitoring state of sensor 
- `blue`: bluetooth monitoring state of sensor

**Sequence**

- [somewhere] something happens that changes the sensor `type` status to `newStatus`.
- [sensor] sends `newStatus` on `status/mySensorSimId/type` topic.
- [maestro] receives message, check `mySensorSimId` in DB, creates Sensor if needed, and updates sensor in DB.

### Measurement push sequence

By default, sensor has measurement capabilities (for wifi and bluetooth). Every `n` minutes, sensor send measurements to kerrigan server to be recorded in DB.

**Sequence**

- [time passing] `n` minutes has passed since last measurement on `measurementType`.
- [sensor] wraps collected information into `measurementContent` and sends `measurementContent` on `measurement/mySensorSimId/measurementType` topic.
- [maestro] receives message, check `mySensorSimId` in DB, creates Sensor if needed, and then creates Measurement in DB.

### Command sending sequence

You can send [commands](https://github.com/anthill/pheromon/blob/master/api/clients/Admin/ReadMe.md) to the sensors.

**Sequence**

- [some admin client] sends a `command` to `[mySensorSimId]` through socketIO.
- [maestro] receives `command` from client, and forwards it to the corresponding sensors through MQTT.
- [sensor] receives message, execute `command`, and sends back the result of the command on the topic `cmdResult/mySensorSimId`
- [maestro] receives message, check `mySensorSimId` in DB, creates Sensor if needed, and then updates Sensor in DB.

## Unitary tests

You can run [Pheromon tests](https://github.com/anthill/pheromon/blob/master/tests/ReadMe.md) in a dedicated docker.

First build the container:
````
docker-compose -f compose-test.yml build
````

Once built, you can use
```
npm run test
```

## Contribute :

* Clone the repository.

* Create a new branch to work in.

* Make a pull request explaining why and what you changed.

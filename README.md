# Pheromon

[![Build Status](https://travis-ci.org/anthill/pheromon.svg)](https://travis-ci.org/anthill/pheromon)

## Overview

**Pheromon is a open innovation project to deploy, administrate and harvest data from a swarm of sensors**. It has been developed in the scope of project 6element dedicated to waste optimisation.

**Learn more about 6element in our [dedicated page](http://ants.builders/pages/6element.html) or in [this Medium article](https://medium.com/ants-blog/6element-534ffbe2a60f)**.

**Use our open API, you can consult the [dedicated wiki](https://github.com/anthill/pheromon/wiki/API-documentation)**.

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
![Admin](https://docs.google.com/drawings/d/1hYEvT4g_LVM7zmEGzJO1e3XTzgCM75etoPKjmiKb08Y/pub?w=960&h=720)

More on those clients later.

## Quick start :

* Install [docker](https://docs.docker.com/) and [docker-compose](http://docs.docker.com/compose/install/) and check docker daemon (or boot2docker) is running.

* Make sure to have the port 5100 opened on your server.

* clone the repository :

```
git clone git@github.com:anthill/pheromon.git
cd pheromon
```

* Copy / Create the files `PRIVATE/*.json`

* Install dependencies
This will also set up the git precommit hook for eslint.

````
npm install
````

### In dev
Use this for development.
You need to have VIRTUAL_PORT and BROKER_PORT set as environment variables.

```
npm run dev
```

The dev service will run on port **9009**, associated with a broker instance on port **9909**.

Use `npm run stop-dev` to stop.

### In alpha
Use this for preproduction.

```
npm run alpha // launch the service
```

The alpha service will run on port **9001**, associated with a broker instance on port **9901**.

Use `npm run stop-alpha` to stop.

### In prod
Use this for production.

```
npm run prod // launch the service
```

The prod service will run on port **9000**, associated with a broker instance on port **9900**.

Use `npm run stop-prod` to stop.
This will also create a `latest.sql` backup file of the db in the `backup` folder.

### Database

* Initialisation
If you run a service without an initialized db, you need to

```
node database/management/init-db.js
```

* Backups and restore : TO BE REWRITTEN

In dev, `./backups` is linked to `/backups` and in prod, `/data/pheromon/backups` is linked to `/backups` where automatic backups (at 3AM) are persisted.
At anytime you can backup the db using

```
docker exec pheromondev_api_1 tools/backup.js > backups/test.sql
```

to load it back **you must put it in your backups folder and give the path inside the container**:

```
docker exec pheromondev_api_1 tools/restore.js /backups/test.sql
```

you can also use a gziped file (comming from the automated backup for example).

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

You can run Pheromon tests in a dedicated docker.

You can use
```
npm run test
```


## Prepare the server and docker for the updater

* Create a user

```sh
sudo useradd -m sensorSSH;
sudo passwd sensorSSH;
```

* Create ssh keys for the user

```sh
su sensorSSH -c 'ssh-keygen -t rsa -b 4096';
```

* Add the sensor public key to the authorized_keys and vice-versa


* Add group docker to the user

```sh
sudo usermod -G docker sensorSSH;
```

* Add theses lines to `/etc/ssh/sshd_config`

```
AllowTcpForwarding yes
GatewayPorts yes
```


* Disable the user (chrooting it would be great)

```sh
sudo usermod -s /usr/sbin/nologin sensorSSH;
```

add `"ip": "kerrigan"` in pheromon `PRIVATE.json` where kerrigan is the name of the host in `.ssh/config` 

## PRIVATE files

There are 2 PRIVATE files:

- `secret.json`: **this file is very sensitive**. Leaking it would potentially allow people to access your db, server, sensors, etc... It should not be required in non protected clients. Here, the only client that requires it is `Admin`, whose access is protected by `html_token`.
```
{
    "server_ip": ..., // your server ip, used by the sensor updater
    "html_token": ..., // token you should use to protect the access to your Admin client or database API
    "mqtt_token": ..., // MQTT for the broker to authenticate sensor
    "cmd_token": ... // token to allow cmd sending to sensor
}
```

`server_ip` is used in `api/maestro.js`.

`html_token` is used in `api/api.js` and `api/routes.js`.

`mqtt_token` is used in `api/api.js` and `broker/index.js`.

`cmd_token` is used in `api/maestro.js` and `api/clients/Admin/src/main.js`.

- `mapbox.json` : this file is not very sensitive. It only contains mapbox infos
```
{
    "token": ..., // token for your mapbox account
    "map_id": ..., // id of your map background
}
```
Both `mapbox.json` fields are used in `api/clients/Dashboard/src/main.js`.

## Licence MIT

## Contribute :

* Clone the repository.

* Create a new branch to work in.

* Make a pull request explaining why and what you changed.

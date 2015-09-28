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

- [sensor] on initialization, sensor sends its [`uninitialized`, `simId`] on `status` topic.
- [broker] authenticates sensor message and transfers it to subscribers.
- [api] receives message, check `simId` in DB, creates sensor if needed, and sends back [`init`, `parameters`] on `simId/command` topic.
- [broker]
- [sensor] receives message, initializes its `parameters` and sends back [`initialized`, `simId`]
- [broker]
- [api] updates DB and web clients 

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

const axios = require("axios");

const helpers = require("./utils/helpers");

class bike {
  constructor(bike, simSetup = null) {
    // general
    this.id = bike._id;
    this.status = bike.status;
    this.number = bike.number;
    this.battery = bike.battery;
    this.position = bike.position;
    this.speed = {
      lat: (Math.random() - 0.5) * 0.001,
      long: (Math.random() - 0.5) * 0.001
    }

    // stations
    this.currentStationName = bike.currentStationName;
    this.currentStationID = bike.currentStation;
    this.startStationName = bike.currentStationName;
    this.startStationID = bike.currentStation;
    this.endStationName = null;
    this.endStationID = null;
    
    // zones
    this.currentZoneName = bike.currentZoneName;
    this.currentZoneID = bike.currentZone;
    this.startZoneName = bike.currentZoneName;
    this.startZoneID = bike.currentZone;
    this.endZoneName = null;
    this.endZoneID = null;

    // simulation
    this.simulationRunIndex = 0
    this.simulationRuns = [];
    this.reRouteNeeded = false;

    // logging
    this.lastUpdate = null;
    this.broadcast = null;
  }

  setBroadcast(time) {
    this.broadcast = time;
  }

  setStationInformation(name, id) {
    const run = this.simulationRuns[this.simulationRunIndex];
    run.endStamp.endStationName = name
    run.endStamp.endStationID = id

    this.currentStationName = name;
    this.currentStationID = id;
    this.endStationName = name;
    this.endStationID = id;
    this.lastUpdate = new Date();
  }

  setZoneInformation(name, id) {
    const run = this.simulationRuns[this.simulationRunIndex];
    run.endStamp.endZoneName = name
    run.endStamp.endZoneID = id

    this.currentZoneName = name;
    this.currentZoneID = id;
    this.endZoneName = name;
    this.endZoneID = id;
    this.lastUpdate = new Date();
  }

  initSimulationRun(
    route, 
    distance, 
    expectedEndStation, 
    startZoneName, 
    startZoneID, 
    startStationName,
    startStationID
  ) {
    this.simulationRuns.push(
      {
        route: route,
        routeLength: route.length,
        routeIndex: 0,
        preDefinedRouteDistance: distance,
        expectedEndStation: expectedEndStation,
        calcDistance: null,
        done: false,
        lastTick: null,
        finishAt: null,
        battery: 100,
        snapshots: [],
        endStamp: {
          startStationName: startStationName,
          startStationID: startStationID,
          startZoneName: startZoneName,
          startZoneID: startZoneID,
          endZoneName: null,
          endZoneID: null,
          endStationName: null,
          endStationID: null,
        }
      }
    );
    this.status = "rented";
    this.battery = 100;
    this.lastUpdate = new Date();
  }

  setSimulationRunDone(distance, tick) {
    const run = this.simulationRuns[this.simulationRunIndex];
    run.done = true;
    run.calcDistance = distance;
    run.lastTick = tick;
    run.finishAt = new Date(); 
    run.battery = this.battery;
    this.lastUpdate = new Date();
    this.battery = 100;
    this.status = "free";
  }

  simulationForceExit() {
    this.battery = 100;
    this.status = "free";
  }

  getSimulationRouteLength() {
    const run = this.simulationRuns[this.simulationRunIndex];
    return run.routeLength;
  }

  getSimulationRouteIndex() {
    const run = this.simulationRuns[this.simulationRunIndex];
    return run.routeIndex;
  }

  getSimulationRunSnapshots() {
    return this.simulationRuns[this.simulationRunIndex].snapshots;
  }

  moveBy() {
    // status: 0 NO ROUTE
    // status: 1 FINISHED
    // status: 2 STEPS LEFT
    const run = this.simulationRuns[this.simulationRunIndex];

    if (!run.route || run.route.length === 0) {
      return {status: 0}
    }

    if (run.routeIndex >= run.route.length) {
      return {status: 1}
    }
    
    this.battery = Math.max(0, this.battery - 0.05);
    const [long, lat] = run.route[run.routeIndex];
    
    const oldLat = this.position.lat;
    const oldLong = this.position.long;

    this.position.lat = lat;
    this.position.long = long;
    
    run.routeIndex++;
    this.lastUpdate = new Date()

    run.snapshots.push(
      {
        beforeMove: {lat: oldLat, long: oldLong},
        afterMove: {lat: lat, long: long},
        at: new Date(),
        lat: lat,
        long: long,
        battery: this.battery
      }
    )

    return {status: 2};
  }

  bikeStatus() {
    return {
      id: this.id,
      position: this.position,
      battery: this.battery,
    }
  }

}

module.exports = bike;
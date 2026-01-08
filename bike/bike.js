const axios = require("axios");

const helpers = require("./helpers");

class bike {
  constructor(bike, simSetup = null) {
    console.log(bike)
    this.id = bike._id;
    this.number = bike.number;
    this.battery = bike.battery;
    this.position = bike.position;
    
    this.currentStationName = bike.currentStationName;
    this.currentStationID = bike.currentStation;
    this.startStationName = bike.currentStationName;
    this.startStationID = bike.currentStation;
    this.endStationName = null;
    this.endStationID = null;
    
    this.currentZoneName = bike.currentZoneName;
    this.currentZoneID = bike.currentZone;
    this.startZoneName = bike.currentZoneName;
    this.startZoneID = bike.currentZoneID;
    this.endZoneName = null;
    this.endZoneID = null;

    this.speed = {
      lat: (Math.random() - 0.5) * 0.001,
      long: (Math.random() - 0.5) * 0.001
    }


    this.lastUpdate = null;

    this.log = {
      snapshots: [],
      distance: null
    }

    this.broadcast = null;
  }

  setBroadcast(time) {
    this.broadcast = time;
  }

  setStationInformation(name, id) {
    this.currentStationName = name;
    this.currentStationID = id;
    this.endStationName = name;
    this.endStationID = id;
    this.lastUpdate = new Date();
  }

  setZoneInformation(name, id) {
    this.currentZoneName = name;
    this.currentZoneID = id;
    this.endZoneName = name;
    this.endZoneID = id;
    this.lastUpdate = new Date();
  }

  randomMove() {
    this.battery = Math.max(0, this.battery - 0.05);

    const newLat = this.position.lat + this.speed.lat;
    const newLong = this.position.long + this.speed.long;

    this.lastUpdate = new Date();
    this.log.snapshots.push(
      {
        beforeMove: {
          lat: this.position.lat,
          long: this.position.long
        },
        afterMove: {
          lat: newLat,
          long: newLong
        },
        battery: this.battery
      }
    )

    this.position.lat = newLat;
    this.position.long = newLong;

    if(this.position.lat < helpers.constants.STOCKHOLM_LAT_MIN ||
      this.position.lat > helpers.constants.STOCKHOLM_LAT_MAX) {
      this.speed.lat = this.speed.lat * -1; // change direction
    }
    if(this.position.long < helpers.constants.STOCKHOLM_LONG_MIN || 
      this.position.long > helpers.constants.STOCKHOLM_LONG_MAX) {
      this.speed.long = this.speed.long * -1; // change direction
    }
  }

  moveBy() {
    console.log("Not implemented..")
  }

  async bikeStatus() {
    return {
      id: this.id,
      position: this.position,
      battery: this.battery,
      log: this.log
    }
  }

}

module.exports = bike;
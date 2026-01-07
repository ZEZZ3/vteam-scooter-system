const axios = require("axios");

const {helpers} = require("./helpers");

const API = process.env.BASE_API_URL || "http://backend:3000";

class bike {
  constructor(bike, simSetup = null) {
    this.id = bike._id;
    this.number = bike.number;
    this.battery = bike.battery;
    this.currentStationID = bike.currentStation;
    this.currentStationName = bike.currentStationName;
    this.currentZoneID = bike.currentZone;
    this.currentZoneName = bike.currentZoneName;
    this.position = bike.position;

    this.speed = {
      lat: (Math.random() - 0.4) * 0.0009,
      long: (Math.random() - 0.4) * 0.009
    }

    this.log = {
      lastUpdate: new Date(),
      snapshots: []
    }
  }

  /* 
    if (simSetup) {
      this.isSim = true;
      this.useMaps = simSetup.useMaps;
      if (this.useMaps) {
        this.route = [];
        this.routeWaypointIndex = 0;
      }
    } else {
      this.isSim = false;
      this.useMaps = false;
    }
    
    this.speed = {
      lat: (Math.random() - 0.4) * 0.0009,
      long: (Math.random() - 0.4) * 0.0009
    }

    this.lastUpdate = new Date();
  } */

  async generateRandomBikeRoute() {

  }

  async randomMove() {
    this.battery = Math.max(0, this.battery - 0.05);

    const newLat = this.position.lat + this.speed.lat;
    const newLong = this.position.long + this.speed.long;
    // need to check if new coords are at a station? else set stationID different
    // station map?
    this.log.lastUpdate = new Date();
    this.log.snapshots.append(
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

    if(this.position.lat < helpers.STOCKHOLM_LAT_MIN || this.position.lat > helpers.STOCKHOLM_LAT_MAX) {
      this.speed.lat = this.speed.lat * -1; // change direction
    }
    if(this.position.long < helpers.STOCKHOLM_LONG_MIN || this.position.long > helpers.STOCKHOLM_LONG_MAX) {
      this.speed.lat = this.speed.lat * -1; // change direction
    }
  }

/*   async updateBike() {
    try {
      const response = await axios.patch(
        `${API}/v1/bikes/${this.id}`,
        {
          position: this.position,
          battery: this.battery
        },
        {
          headers: {
            "Content-Type": "application/json"
          },
          timeout: 2000
        }
      );

      if (response.status === 200) {
        this.lastUpdate = new Date()
        console.log(`Bike: ${this.id} updated. Lat: ${this.position.lat}, long: ${this.position.long}`)
      }
    } catch (e) {
      console.log(`Bike: ${this.id} update error. ${e.message}`);
    }

  } */

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
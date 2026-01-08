require("dotenv").config();
const express = require("express");
const io = require("socket.io-client");
const Bike = require("./bike");
const helpers = require("./helpers")
const axios = require("axios");

const app = express();
app.use(express.json());

const port = process.env.BIKE_SERVER_PORT;
const API = process.env.BASE_API_URL || "http://backend:3000";
const bikes = new Map();
const stations = [];
const zones = [];

let socket;
let server;
let serviceToken = null;
let serviceTokenExpiresIn = 0;
let simulationRunning = false;
let simulationInterval = null;
let simulationMoveCounter = 0;
let broadcastInterval = null;

let configuration = {
    broadcastRate: helpers.constants.BROADCAST_RATE || 5000,
    simulationRate: helpers.constants.SIMULATION_RATE || 5000,
    simulationBikeLimit: helpers.constants.BIKE_LIMIT || bikes.size,
    simulationMoveLimit: helpers.constants.SIMULATION_MOVE_LIMIT
}

async function connectToBackend() {
    
    return new Promise((resolve, reject) => {
        let totalAttempts = 0;
        helpers.print("Socket", `Connecting to backend websocket via ${API}`)
        
        socket = io(API, {
            reconnection: true,
            reconnectionDelay: helpers.constants.RETRY_DELAY,
            reconnectionAttempts: helpers.constants.MAX_RETRY,
            transports: ["websocket", "polling"],
            timeout: helpers.constants.RETRY_DELAY * 5
        });

        socket.on("connect", () =>{
            helpers.print("Socket", "Connected to backend.")
            resolve();
        })

        socket.on("disconnect", () =>{
            helpers.print("Socket", "Disconnected from backend.")
        })
        
        socket.on("connect_error", (e) => {
            totalAttempts++;
            helpers.print("Socket", `Could not connect to ${API}. ${totalAttempts}/${helpers.constants.MAX_RETRY}`);
            helpers.print("Socket", e.message);
            
            if (totalAttempts >= helpers.constants.MAX_RETRY) {
                reject(new Error("Could not connect to backend."))
            }
        })

        socket.on("error", (e) =>{
            helpers.print("Socket", `Websocket error: ${e}`)
        })

        setTimeout(() => {
            if(!socket.connected) {
                reject(new Error("Connection timeout"));
            }
        }, 30000);
    });
}

function startNewBike(id, data) {
    try {
        bikes.set(id, new Bike(data));
        socket.emit("bike-connect", {
            id: id
        });
    } catch (e) {
        helpers.print("Server: warn", `Could not initialize bike with ID: ${id}. Error: ${e.message}`)
    }
}

async function initializeBikes() {
    try {
        helpers.print("Server", "Initializing bikes.")
        const res = await helpers.getServiceToken(serviceToken, serviceTokenExpiresIn)

        serviceToken = res.token;
        serviceTokenExpiresIn = res.expiry;

        helpers.print("Server", "Getting bike data from backend.")
        const response = await axios.get(`${API}/api/v1/service/bikes`, {
            headers: {
                "x-access-token": serviceToken
            }
        });
        
        let allBikes = response.data.data
        if (!Array.isArray(allBikes) || allBikes.length === 0) {
            helpers.print("Server: warn", "No bikes found.")
            return;
        }
        
        if(!socket || !socket.connected) {
            throw new Error("No socket connection to backend.")
        }
        
        const limit = configuration.simulationBikeLimit;
        if (limit > 0) {
            allBikes = allBikes.slice(0, limit)
            helpers.print("Server", `Set bike limit to: ${limit}/${allBikes.length}`)
        }

        for (const bikeData of allBikes) {
            if (bikeData.position) {
                const bikeID = bikeData._id;
                startNewBike(bikeID, bikeData);
            }
        }
        helpers.print("Server", `Mapped: ${bikes.size} bikes.`)
        helpers.print("Server", "Bikes initialized.")
    } catch (e) {
        helpers.print("Server: warn", `Could not initialize bikes. Error: ${e.message}`)
    }
}

async function getStations() {
    try {
        helpers.print("Server", "Fetching station information.")
        const res = await helpers.getServiceToken(serviceToken, serviceTokenExpiresIn)

        serviceToken = res.token;
        serviceTokenExpiresIn = res.expiry;
        helpers.print("Server", "Getting station data from backend.")
        const response = await axios.get(`${API}/api/v1/service/stations`, {
            headers: {
                "x-access-token": serviceToken
            }
        });
        
        const allStations = response.data.data

        if (!Array.isArray(allStations) || allStations.length === 0) {
            helpers.print("Server: warn", "No stations found.")
            return;
        } 

        for (const stationData of allStations) {
            stations.push(
                {
                    cityID: stationData.cityID,
                    zoneID: stationData.zoneID, 
                    stationID: stationData._id,
                    stationName: stationData.name,
                    radius: stationData.radius,
                    position: stationData.position
                }
            );
        }

        helpers.print("Server", "Finished fetching station information.")
        helpers.print("Server", `Got: ${stations.length} stations.`)

    } catch (e) {
        helpers.print("Server", `Could not fetch stations. Error: ${e.message}`)
    }
}

async function getZones() {
    try {
        helpers.print("Server", "Fetching zone information.")
        const res = await helpers.getServiceToken(serviceToken, serviceTokenExpiresIn)

        serviceToken = res.token;
        serviceTokenExpiresIn = res.expiry;
        helpers.print("Server", "Getting zone data from backend.")
        const response = await axios.get(`${API}/api/v1/service/zones`, {
            headers: {
                "x-access-token": serviceToken
            }
        });
        
        const allZones = response.data.data

        if (!Array.isArray(allZones) || allZones.length === 0) {
            helpers.print("Server: warn", "No zones found.")
            return;
        } 

        for (const zoneData of allZones) {
            zones.push(
                {
                    cityID: zoneData.cityID,
                    zoneID: zoneData._id, 
                    zoneName: zoneData.name,
                    zoneArea: zoneData.area,
                }
            );
        }

        helpers.print("Server", "Finished fetching zone information.")
        helpers.print("Server", `Got: ${zones.length} zones.`)

    } catch (e) {
        helpers.print("Server", `Could not fetch zones. Error: ${e.message}`)
    }
}

function startBroadcast() {
    broadcastInterval = setInterval(() => {
        helpers.print("Socket: log", "Broadcasting to backend.")
        let broadcastCounter = 0;
        for(const [_, bike] of bikes) {

            const lastUpdate = bike?.lastUpdate?.getTime() || 0;
            const lastBroadcast = bike.broadcast?.getTime() || 0;
            
            if(socket && socket.connected) {
                if (lastBroadcast < lastUpdate) {
                    socket.emit("bike-update", bike)
                    bike.setBroadcast(new Date());
                    broadcastCounter++;
                }
            } 
        }
        helpers.print("Socket: log", `Broadcasted: ${broadcastCounter} changes.`)
    }, configuration.broadcastRate)
}

function stopBroadcast() {
    if (!broadcastInterval) {
        helpers.print("Server: warn", "No active broadcast.")
        return
    }
    helpers.print("Server", "Stopping broadcast.")
    clearInterval(broadcastInterval);
}

function moveBike(bike, random=true) {
    
    if (random) {
        bike.randomMove();
        
        // try to midigate leaving zone (mainly try to not go into water)
        // random movement so its hard to prevent
        const currPos = bike.position;
        const zone = locateZone(currPos.lat, currPos.long);
        if (!zone) {
            bike.speed.lat = bike.speed.lat * -1;
            bike.speed.long = bike.speed.long * -1;
        }
    } else {
        bike.moveBy();
    }
    //console.log(`${bike.position.lat} : ${bike.position.long}`)
}

// find the closest station based on a station radius. 
// if there is not station within station radius null is returned.
function locateCloseStation(lat, long) {
    let closestStation = null;
    let closestStationDistance = Infinity;
    
    for(const station of stations) {
        const d = helpers.twoPointDistance(
            lat, long, station.position.lat, station.position.long
        );

        if (d <= station.radius) {
            if (d < closestStationDistance) {
                closestStationDistance = d;
                closestStation = station
            }
        }
    }
    
    return closestStation;
}

function locateZone(lat, long) {
    for(const zone of zones) {
        let isInZone = helpers.findPointInZone(lat, long, zone.zoneArea)
        if (isInZone) {
            return zone;
        }
    }
    return null;
}

async function enableDefaultServerFunctionality() {
    try {
        await connectToBackend();
        await getStations();
        await getZones();
        await initializeBikes();
        startBroadcast();
        startSimulation();
    } catch (e) {
        throw new Error(e.message);
    }
}

function startSimulation() {
    if (simulationRunning) {
        helpers.print("Server: warn", "Simulation is already running.")
        return
    }

    helpers.print("Server", "Starting simulation.")
    simulationRunning = true;
    simulationMoveCounter = 0;

    for(let i = 0; i < configuration.simulationMoveLimit; i++) {
        helpers.print(
            "Simulation", 
            `Move: ${simulationMoveCounter}/${configuration.simulationMoveLimit}`
        )
        
        for(const [_, bike] of bikes) {
            moveBike(bike)
        }
        simulationMoveCounter++;
    }
    
    stopSimulation();
}

function stopSimulation() {
    if (!simulationRunning) {
        helpers.print("Server: warn", "No simulation running.")
        return
    }
    helpers.print("Server", "Stopping simulation.")
    
    simulationRunning = false;
    //clearInterval(simulationInterval);

    bikes.forEach(bike => {

        const lat = bike.position.lat;
        const long = bike.position.long;
        const nearbyStation = locateCloseStation(lat, long);

        if (nearbyStation) {
            bike.setStationInformation(nearbyStation.stationName, nearbyStation.stationID);
        } else {
            bike.setStationInformation(null, null);
        }

        const zone = locateZone(lat, long);
        if (zone) {
            bike.setZoneInformation(zone.zoneName, zone.zoneID);
        } else {
            bike.setZoneInformation(null, null);
        }

        const travelSteps = bike.log.snapshots;
        const distance = helpers.calculateDistance(travelSteps);
        bike.log.distance = distance;
        const slat = travelSteps[0].beforeMove.lat
        const slong = travelSteps[0].beforeMove.long
        const elat = travelSteps[travelSteps.length - 1].afterMove.lat
        const elong = travelSteps[travelSteps.length - 1].afterMove.long
        console.log("----------------")
        console.log("start zone: ", bike.startZoneName);
        console.log("end zone: ", bike.endZoneName);
        console.log("start station: ", bike.startStationName);
        console.log("end station: ", bike.endStationName);
        console.log("distance: ", distance);
        console.log(`start coord: ${slat}, ${slong}`)
        console.log(`end coord: ${elat}, ${elong}`)

    });
}

async function startBikeServer() {
    try {
        await enableDefaultServerFunctionality();
        
        app.listen(port, async () => {
            helpers.print("Server", `Bike server running on port ${port} [Standard operation]`)
            helpers.print("Server", `Use the CLI to enter simulation/configure.`)
        })
    } catch (e) {
        helpers.print("Server: warn", `Startup failed: ${e.message}`)
        process.exit(1);
    }
}

startBikeServer();

module.exports = server;
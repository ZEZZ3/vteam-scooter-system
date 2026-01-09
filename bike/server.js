require("dotenv").config();
const express = require("express");
const io = require("socket.io-client");
const Bike = require("./bike");
const helpers = require("./helpers")
const axios = require("axios");

const app = express();
app.use(express.json());

const port = process.env.BIKE_SERVER_PORT;
const routeURL = process.env.ROUTE_URL;
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
let finishedSimulatedRoutes = 0;
let longestRoute = 0;
let shortestRoute = Infinity;

let configuration = {
    broadcastEnable: true,
    broadcastRate: helpers.constants.BROADCAST_RATE || 5000,
    simulationRate: helpers.constants.SIMULATION_RATE || 5000,
    simulationBikeLimit: helpers.constants.BIKE_LIMIT || bikes.size,
    simulationMoveLimit: helpers.constants.SIMULATION_MOVE_LIMIT,
    simulationReRouteLimit: 5,
    verbose: true
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
    if (configuration.broadcastEnable) {
        broadcastInterval = setInterval(() => {
            helpers.print("Socket", "Broadcasting to backend.")
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
            helpers.print("Socket", `Broadcasted: ${broadcastCounter} changes.`)
        }, configuration.broadcastRate)
        return
    } 
    return;

}

function stopBroadcast() {
    if (!broadcastInterval) {
        helpers.print("Server: warn", "No active broadcast.")
        return
    }
    helpers.print("Server", "Stopping broadcast.")
    clearInterval(broadcastInterval);
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


async function getRoute(start, end) {
    const url = `${routeURL}/route/v1/driving/${start.long},${start.lat};${end.long},${end.lat}?overview=full&geometries=geojson`;
    const result = await axios.get(url);
    const route = result.data.routes[0].geometry.coordinates;
    const distance = result.data.routes[0].distance;
    return {route, distance};
}

async function setRandomRoute(bike) {
    try {
        const randomStation = stations[Math.floor(Math.random() * stations.length)];
        //const randomStation = stations[3];
        const start = bike.position;
        const end = randomStation.position;
        const nearbyStation = locateCloseStation(start.lat, start.long);
        //const zone = locateZone(start.lat, start.long);
        const zone = zones.find(z => z.zoneID === nearbyStation.zoneID)

        const {route, distance} = await getRoute(start, end);
        bike.initSimulationRun(route, distance, randomStation.stationName, 
            zone.zoneName, zone.zoneID, nearbyStation.stationName, nearbyStation.stationID)
    } catch (e) {
        throw new Error(e);
    }
}

function findLongestRoute() {
    let longest = 0;
    for (const bike of bikes.values()) {
        const len = bike.simulationRuns[bike.simulationRunIndex].route.length;
        if (len > longest) {
            longest = len;
        }
    }
    return longest;
}

function findShortestRoute() {
    let shortest = Infinity;
    for (const bike of bikes.values()) {
        const len = bike.simulationRuns[bike.simulationRunIndex].route.length;
        if (len < shortest) {
            shortest = len;
        }
    }
    return shortest;
}

async function setRandomRoutes() {

    for(const [_, bike] of bikes) {
        try {
            await setRandomRoute(bike);
        } catch (e) {
            helpers.print("Server: warn", `Bike routing error: ${e.message}`);
            continue;
        }
    }
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


function createSimulationIntervalSingle() {
    finishedSimulatedRoutes = 0;
    longestRoute = findLongestRoute();
    shortestRoute = findShortestRoute();

    helpers.print(
        "Simulation", 
        `tick | shortest/longest route | progress | tickrate | tick-limit `
    );
    simulationInterval = setInterval(async () => {
        const t = simulationMoveCounter;
        const fSR = finishedSimulatedRoutes
        const fR = configuration.simulationRate
        const sML = configuration.simulationMoveLimit
        helpers.print(
            "Simulation", 
            `t: ${t} | s_r/l_r: ${shortestRoute}/${longestRoute} | ${fSR}/${bikes.size} | t_r: ${fR}ms | t_l: ${sML}`
        );


        if (simulationMoveCounter >= configuration.simulationMoveLimit) {
            helpers.print("Simulation", `Ending simulation, reached tick-limit (${simulationMoveCounter}/${configuration.simulationMoveLimit})`);
            stopSimulation();
            return;
        }

        //finishedCount = 0;

        for(const bike of bikes.values()) {
            
            // skip if bike is done.
            if (bike.simulationRuns[bike.simulationRunIndex].done) {
                //finishedCount++;
                continue;
            }

            const res = bike.moveBy();

            switch (res.status) {
                case 0:
                    helpers.print("Simulation: warn", "Attempted to move without route!")
                    break;
                case 1:
                    const bikeLat = bike.position.lat;
                    const bikeLong = bike.position.long;
                    
                    const nearbyStation = locateCloseStation(bikeLat, bikeLong);
                    if (nearbyStation) {
                        bike.setStationInformation(nearbyStation.stationName, nearbyStation.stationID);
                    } else {
                        bike.setStationInformation(null, null);
                    }

                    const zone = locateZone(bikeLat, bikeLong);
                    if (zone) {
                        bike.setZoneInformation(zone.zoneName, zone.zoneID);
                    } else {
                        bike.setZoneInformation(null, null);
                    }

                    const snapshots = bike.getSimulationRunSnapshots()
                    const distance = helpers.calculateDistance(snapshots);
                    bike.setSimulationRunDone(distance, simulationMoveCounter);
                    
                    finishedSimulatedRoutes++;
                    //finishedCount += 1;
                    break;
                case 2:
                    // steps left
                    //helpers.print("Simulation", `B-${bike.number}: ${bike.getSimulationRouteIndex()}/${bike.getSimulationRouteLength()}`)
                    break;
            }
        }

        if (finishedSimulatedRoutes === bikes.size) {
            helpers.print("Simulation", `All ${bikes.size} bikes finished their routes.`);
            stopSimulation();
            return;
        }
        simulationMoveCounter++;      

    }, configuration.simulationRate);
}

function checkIfDone() {

    for(const bike of bikes.values()) {
        const run = bike.simulationRuns[bike.simulationRunIndex];
        if(!run) {
            return false;
        }

        if (!run.done) {
            return false
        }

        if (bike.simulationRuns.length < configuration.simulationReRouteLimit && 
            simulationMoveCounter < configuration.simulationMoveLimit
        ) {
            return false;                        
        }
    }
    return true;

}

function createSimulationIntervalLoop() {
    finishedSimulatedRoutes = 0;
    longestRoute = findLongestRoute();
    shortestRoute = findShortestRoute();

    helpers.print(
        "Simulation", 
        `tick | shortest/longest route | active | finished | tickrate | tick-limit `
    );
    simulationInterval = setInterval(async () => {
        const t = simulationMoveCounter;
        const fSR = finishedSimulatedRoutes
        const fR = configuration.simulationRate
        const sML = configuration.simulationMoveLimit
        
        let active = 0;
        for (const bike of bikes.values()) {
            const run = bike.simulationRuns[bike.simulationRunIndex];
            if(!run) {
                helpers.print("Simulation: warn", `Bike ${bike.number} has invalid run index ${bike.simulationRunIndex}`)
                helpers.print("Simulation: warn", `${bike.simulationRuns.length}`)
                continue;
            } 
            if (!run.done) {
                active++;
            }
        }
        
        helpers.print(
            "Simulation", 
            `t: ${t} | s_r/l_r: ${shortestRoute}/${longestRoute} | ${active} | ${fSR} | t_r: ${fR}ms | t_l: ${sML}`
        );

        let bikeStr = ""
        if (active < 10) {
            for(const bike of bikes.values()) {
                bikeStr += `B${bike.number}: ${bike.getSimulationRouteIndex()}/${bike.getSimulationRouteLength()} (${bike.simulationRuns.length}) | `
            }
            helpers.print("Simulation", bikeStr);
        }

       
        if (checkIfDone()) {
            helpers.print("Simulation", `Ending simulation, passed tick-limit (${simulationMoveCounter}/${configuration.simulationMoveLimit})`);
            stopSimulationLoop();
            return;
        }

        for(const bike of bikes.values()) {
            const run = bike.simulationRuns[bike.simulationRunIndex];

            if(!run) {
                helpers.print("Simulation: warn", `Bike ${bike.number} has invalid run index ${bike.simulationRunIndex}`)
                helpers.print("Simulation: warn", `${bike.simulationRuns.length}`)
                continue;
            } 

            // new route needed
            if (run.done) {
                if (bike.simulationRuns.length < configuration.simulationReRouteLimit && 
                    simulationMoveCounter < configuration.simulationMoveLimit
                ) {
                    bike.reRouteNeeded = true;                        
                } 
                continue;
            }

            const res = bike.moveBy();

            switch (res.status) {
                case 0:
                    helpers.print("Simulation: warn", "Attempted to move without route!")
                    break;
                case 1:
                    const bikeLat = bike.position.lat;
                    const bikeLong = bike.position.long;
                    
                    const nearbyStation = locateCloseStation(bikeLat, bikeLong);
                    if (nearbyStation) {
                        bike.setStationInformation(nearbyStation.stationName, nearbyStation.stationID);
                    } else {
                        bike.setStationInformation(null, null);
                    }

                    const zone = locateZone(bikeLat, bikeLong);
                    if (zone) {
                        bike.setZoneInformation(zone.zoneName, zone.zoneID);
                    } else {
                        bike.setZoneInformation(null, null);
                    }

                    const snapshots = bike.getSimulationRunSnapshots()
                    const distance = helpers.calculateDistance(snapshots);
                    bike.setSimulationRunDone(distance, simulationMoveCounter);

                    finishedSimulatedRoutes++;

                    //finishedCount += 1;
                    break;
                case 2:
                    // steps left
                    //helpers.print("Simulation", `Route step: ${bike.getSimulationRouteIndex()}/${bike.getSimulationRouteLength()}`)
                    break;
            }
        }
        
        for(const bike of bikes.values()) {
            if (!bike.reRouteNeeded) {
                continue;
            }
            try {
                bike.simulationRunIndex++;
                await setRandomRoute(bike);
                bike.reRouteNeeded = false;
                longestRoute = findLongestRoute();
                shortestRoute = findShortestRoute();
            } catch (e) {
                helpers.print("Simulation: warn", `Bike routing error: ${e.message}`)
            }
        }

/*         longestRoute = findLongestRoute();
        shortestRoute = findShortestRoute(); */
        simulationMoveCounter++;

    }, configuration.simulationRate);   
}

async function startSimulation(loop = true) {
    if (simulationRunning) {
        helpers.print("Server: warn", "Simulation is already running.")
        return
    }

    simulationRunning = true;
    simulationMoveCounter = 0;
    
    await setRandomRoutes();
    
    if(loop) {
        helpers.print("Server", `Starting simulation. Run all bikes through ${configuration.simulationReRouteLimit} routes.`)
        createSimulationIntervalLoop();
    } else {
        helpers.print("Server", "Starting simulation. Runs all bikes once")
        createSimulationIntervalSingle();
    }
    
}

function stopSimulation() {
    if (!simulationRunning) {
        helpers.print("Server: warn", "No simulation running.")
        return
    }
    helpers.print("Server", "Stopping simulation.")
    
    simulationRunning = false;
    clearInterval(simulationInterval);
    stopBroadcast();
    
    console.log("----------------------------------------")
    helpers.print("Simulation", "Simulation recap")
    console.log("----------------------------------------")
    console.log("Finished routes: ", finishedSimulatedRoutes)
    for (const bike of bikes.values()) {
        const run = bike.simulationRuns[bike.simulationRunIndex];
        const endStamp = run.endStamp;
        console.log()
        console.log(
            `Bike: ${bike.id}
            Start station: ${endStamp.startStationName}, ID: ${endStamp.startStationID}
            End station: ${endStamp.endStationName}, ID: ${endStamp.endStationID}
            Start zone: ${endStamp.startZoneName}, ID: ${endStamp.startZoneID}
            End zone: ${endStamp.endZoneName}, ID: ${endStamp.endZoneID}
            Expected End Station: ${run.expectedEndStation}
            Route steps: ${run.routeLength}
            osrm-distance: ${run.preDefinedRouteDistance}
            calc-distance: ${run.calcDistance}
            End on tick: ${run.lastTick}
            Finished at: ${run.finishAt}`
        );
    }
}

function stopSimulationLoop() {
    if (!simulationRunning) {
        helpers.print("Server: warn", "No simulation running.")
        return
    }
    helpers.print("Server", "Stopping simulation.")
    
    simulationRunning = false;
    clearInterval(simulationInterval);
    stopBroadcast();
    
    console.log("----------------------------------------")
    helpers.print("Simulation", "Simulation recap")
    console.log("----------------------------------------")
    //console.log("Finished routes: ", finishedSimulatedRoutes)
    for (const bike of bikes.values()) {
        const runs = bike.simulationRuns;
        
        console.log(`Bike: ${bike.id} ran ${runs.length} routes. `
        );
        let runNum = 1;
        runs.forEach(run => {
            console.log(`
                tick: ${run.lastTick}/${simulationMoveCounter}
                Route ${runNum}: ${run.endStamp.startStationName} -> ${run.endStamp.endStationName}. 
                End as excpected: ${run.endStamp.endStationName === run.expectedEndStation}
                steps: ${run.routeLength}
                calc-distance: ${run.calcDistance}
                osrm-distance: ${run.preDefinedRouteDistance}
                `
            )
            
            runNum++;
        });
        console.log("----------------------------------------")
    }
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
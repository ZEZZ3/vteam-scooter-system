require("dotenv").config();
const express = require("express");
const io = require("socket.io-client");
const Bike = require("./bike");
const helpers = require("./utils/helpers")
const printer = require("./utils/print")
const axios = require("axios");
const readline = require("readline");


const app = express();
app.use(express.json());

const port = process.env.BIKE_SERVER_PORT;
const routeURL = process.env.ROUTE_URL;
const API = process.env.BASE_API_URL || "http://backend:3000";

let bikes = new Map();
let stations = [];
let zones = [];
let simulationLog = [];
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
let broadcastToServer = 0;

let configuration = {
    broadcastEnable: true,
    broadcastRate: helpers.constants.BROADCAST_RATE || 5000,
    simulationRate: helpers.constants.SIMULATION_RATE || 5000,
    simulationBikeLimit: helpers.constants.BIKE_LIMIT || bikes.size,
    simulationMoveLimit: helpers.constants.SIMULATION_MOVE_LIMIT,
    simulationReRouteLimit: helpers.constants.SIMULATION_REROUTE_LIMIT,
    verbose: false
}

async function connectToBackend() {
    
    return new Promise((resolve, reject) => {
        let totalAttempts = 0;
        printer.print("Socket", `Connecting to backend websocket via ${API}`)
        
        socket = io(API, {
            reconnection: true,
            reconnectionDelay: helpers.constants.RETRY_DELAY,
            reconnectionAttempts: helpers.constants.MAX_RETRY,
            transports: ["websocket", "polling"],
            timeout: helpers.constants.RETRY_DELAY * 5
        });

        socket.on("connect", () =>{
            printer.print("Socket", "Connected to backend.")
            resolve();
        })

        socket.on("disconnect", () =>{
            printer.print("Socket", "Disconnected from backend.")
        })
        
        socket.on("connect_error", (e) => {
            totalAttempts++;
            printer.print("Socket", `Could not connect to ${API}. ${totalAttempts}/${helpers.constants.MAX_RETRY}`);
            printer.print("Socket", e.message);
            
            if (totalAttempts >= helpers.constants.MAX_RETRY) {
                reject(new Error("Could not connect to backend."))
            }
        })

        socket.on("error", (e) =>{
            printer.print("Socket", `Websocket error: ${e}`)
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
        printer.print("Server: warn", `Could not initialize bike with ID: ${id}. Error: ${e.message}`)
    }
}

async function initializeBikes() {
    try {
        bikes = new Map();

        printer.print("Server", "Initializing bikes.")
        const res = await helpers.getServiceToken(serviceToken, serviceTokenExpiresIn)

        serviceToken = res.token;
        serviceTokenExpiresIn = res.expiry;

        printer.print("Server", "Getting bike data from backend.")
        const response = await axios.get(`${API}/api/v1/service/bikes`, {
            headers: {
                "x-access-token": serviceToken
            }
        });
        
        let allBikes = response.data.data
        if (!Array.isArray(allBikes) || allBikes.length === 0) {
            printer.print("Server: warn", "No bikes found.")
            return;
        }
        
        if(!socket || !socket.connected) {
            throw new Error("No socket connection to backend.")
        }
        
        const limit = configuration.simulationBikeLimit;
        if (limit > 0) {
            allBikes = allBikes.slice(0, limit)
            printer.print("Server", `Set bike limit to: ${limit}/${allBikes.length}`)
        }

        for (const bikeData of allBikes) {
            if (bikeData.position) {
                const bikeID = bikeData._id;
                startNewBike(bikeID, bikeData);
            }
        }
        printer.print("Server", `Mapped: ${bikes.size} bikes.`)
        printer.print("Server", "Bikes initialized.")
    } catch (e) {
        console.log(e.stack)
        printer.print("Server: warn", `Could not initialize bikes. Error: ${e.message}`)
    }
}

async function getStations() {
    try {
        printer.print("Server", "Fetching station information.")
        const res = await helpers.getServiceToken(serviceToken, serviceTokenExpiresIn)

        serviceToken = res.token;
        serviceTokenExpiresIn = res.expiry;
        printer.print("Server", "Getting station data from backend.")
        const response = await axios.get(`${API}/api/v1/service/stations`, {
            headers: {
                "x-access-token": serviceToken
            }
        });
        
        const allStations = response.data.data

        if (!Array.isArray(allStations) || allStations.length === 0) {
            printer.print("Server: warn", "No stations found.")
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

        printer.print("Server", "Finished fetching station information.")
        printer.print("Server", `Got: ${stations.length} stations.`)

    } catch (e) {
        printer.print("Server", `Could not fetch stations. Error: ${e.message}`)
    }
}

async function getZones() {
    try {
        printer.print("Server", "Fetching zone information.")
        const res = await helpers.getServiceToken(serviceToken, serviceTokenExpiresIn)

        serviceToken = res.token;
        serviceTokenExpiresIn = res.expiry;
        printer.print("Server", "Getting zone data from backend.")
        const response = await axios.get(`${API}/api/v1/service/zones`, {
            headers: {
                "x-access-token": serviceToken
            }
        });
        
        const allZones = response.data.data

        if (!Array.isArray(allZones) || allZones.length === 0) {
            printer.print("Server: warn", "No zones found.")
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

        printer.print("Server", "Finished fetching zone information.")
        printer.print("Server", `Got: ${zones.length} zones.`)

    } catch (e) {
        printer.print("Server", `Could not fetch zones. Error: ${e.message}`)
    }
}

function startBroadcast() {
    broadcastToServer = 0;
    if (configuration.broadcastEnable) {
        broadcastInterval = setInterval(() => {
            for(const [_, bike] of bikes) {
    
                const lastUpdate = bike?.lastUpdate?.getTime() || 0;
                const lastBroadcast = bike.broadcast?.getTime() || 0;
                
                if(socket && socket.connected) {
                    if (lastBroadcast < lastUpdate) {
                        socket.emit("bike-update", bike)
                        bike.setBroadcast(new Date());
                        broadcastToServer++;
                    }
                } 
            }
        }, configuration.broadcastRate)
        return
    } 
    return;

}

function stopBroadcast() {
    if (!broadcastInterval) {
        printer.print("Server: warn", "No active broadcast.")
        return
    }
    printer.print("Server", "Stopping broadcast.")
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
        const start = bike.position;
        const end = randomStation.position;
        const nearbyStation = locateCloseStation(start.lat, start.long);
        const zone = zones.find(z => z.zoneID === nearbyStation.zoneID)

        const {route, distance} = await getRoute(start, end);
        bike.initSimulationRun(route, distance, randomStation.stationName, 
            zone.zoneName, zone.zoneID, nearbyStation.stationName, nearbyStation.stationID)
    } catch (e) {
        throw new Error(e);
    }
}

async function setRandomRoutes() {

    for(const [_, bike] of bikes) {
        try {
            await setRandomRoute(bike);
        } catch (e) {
            printer.print("Server: warn", `Bike routing error: ${e.message}`);
            continue;
        }
    }
}


function createSimulationIntervalSingle() {
    finishedSimulatedRoutes = 0;
    longestRoute = helpers.findLongestRoute(bikes);
    shortestRoute = helpers.findShortestRoute(bikes);

    simulationInterval = setInterval(async () => {
        
        const log = {
            tick: simulationMoveCounter,
            shortestRoute: shortestRoute,
            longestRoute: longestRoute,
            finishedBikes: finishedSimulatedRoutes,
            bikes: [],
            status: "",
            errors: []
        }

        if (simulationMoveCounter >= configuration.simulationMoveLimit) {
            log.status = "Simulation tick limit hit."
            stopSimulation();
            return;
        }

        for(const bike of bikes.values()) {
            
            // skip if bike is done.
            if (bike.simulationRuns[bike.simulationRunIndex].done) {
                continue;
            }

            const res = bike.moveBy();

            switch (res.status) {
                case 0:
                    log.errors.push(`B${bike.number} attempted to move without route!`) 
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
                    break;
                case 2:
                    // steps left
                    break;
            }

            log.bikes.push(bike);
        }

        printer.runtimePrint(
            simulationMoveCounter, configuration.simulationMoveLimit, 
            finishedSimulatedRoutes, bikes.size, broadcastToServer,
            configuration.broadcastRate, configuration.simulationRate, 
            shortestRoute, longestRoute
        );

        if (finishedSimulatedRoutes === bikes.size) {
            log.status = `All ${bikes.size} bikes finished their routes.`
            simulationLog.push(log)
            stopSimulation();
            return;
        }

        simulationLog.push(log)

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
    longestRoute = helpers.findLongestRoute(bikes);
    shortestRoute = helpers.findShortestRoute(bikes);

    simulationInterval = setInterval(async () => {

        let active = 0;
        for (const bike of bikes.values()) {
            const run = bike.simulationRuns[bike.simulationRunIndex];
            if(!run) {
                continue;
            } 
            if (!run.done) {
                active++;
            }
        }

        const log = {
            tick: simulationMoveCounter,
            shortestRoute: shortestRoute,
            longestRoute: longestRoute,
            finishedBikes: finishedSimulatedRoutes,
            bikes: [],
            status: "",
            active: active,
            errors: []
        }
       
        if (checkIfDone()) {
            log.status = `Ending simulation, passed tick-limit (${simulationMoveCounter}/${configuration.simulationMoveLimit})`;
            stopSimulationLoop();
            return;
        }

        for(const bike of bikes.values()) {
            const run = bike.simulationRuns[bike.simulationRunIndex];

            if(!run) {
                log.errors.push(`Bike ${bike.number} has invalid run index ${bike.simulationRunIndex}`)
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
                    log.errors.push(`B${bike.number} attempted to move without route!`) 
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

                    break;
                case 2:
                    // steps left
                    break;
            }
            log.bikes.push(bike);
        }
        
        for(const bike of bikes.values()) {
            if (!bike.reRouteNeeded) {
                continue;
            }
            try {
                bike.simulationRunIndex++;
                await setRandomRoute(bike);
                bike.reRouteNeeded = false;
                longestRoute = helpers.findLongestRoute(bikes);
                shortestRoute = helpers.findShortestRoute(bikes);
            } catch (e) {
                log.errors.push(`Bike routing error: ${e.message}`)
            }
        }

        simulationMoveCounter++;

    }, configuration.simulationRate);   
}

async function startSimulation(loop = false) {
    if (simulationRunning) {
        printer.print("Server: warn", "Simulation is already running.")
        return
    }

    simulationRunning = true;
    simulationMoveCounter = 0;
    
    await setRandomRoutes();
    console.log("------------------------------------------")
    printer.clearScreen();

    if (loop) { 
        createSimulationIntervalLoop(); 
    } else { 
        createSimulationIntervalSingle(); 
    }
}

function stopSimulation() {
    if (!simulationRunning) {
        printer.print("Server: warn", "No simulation running.")
        return
    }

    const status = simulationLog[simulationLog.length - 1].status
    if (status) {
        printer.print("Simulation", status)
    } else {
        printer.print("Simulation", "Stopping simulation.")
    }
    
    simulationRunning = false;
    clearInterval(simulationInterval);
    stopBroadcast();
}

function stopSimulationLoop() {
    if (!simulationRunning) {
        printer.print("Server: warn", "No simulation running.")
        return
    }
    printer.print("Server", "Stopping simulation.")
    
    simulationRunning = false;
    clearInterval(simulationInterval);
    stopBroadcast();
    
    console.log("----------------------------------------")
    printer.print("Simulation", "Simulation recap")
    console.log("----------------------------------------")
    console.log("Finished routes: ", finishedSimulatedRoutes)
    console.log("Expect: ", configuration.simulationReRouteLimit * bikes.size);
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

async function enableDefaultServerFunctionality() {
    try {
        await connectToBackend();
        await getStations();
        await getZones();
    } catch (e) {
        throw new Error(e.message);
    }
}

async function startBikeServer() {
    try {
        await enableDefaultServerFunctionality();
        
        app.listen(port, async () => {
            printer.print("Server", `Bike server running on port ${port} [Standard operation]`)
            printer.print("Server", `Use the CLI to enter simulation/configure.`)
            printer.print("Server", `Enter 'help' for instructions.`)
        })

        commandLine();

    } catch (e) {
        printer.print("Server: warn", `Startup failed: ${e.message}`)
        process.exit(1);
    }
}

startBikeServer();

/*         printer.print(
            "Simulation", 
            `t: ${t} | s_r/l_r: ${shortestRoute}/${longestRoute} | ${fSR}/${bikes.size} | t_r: ${fR}ms | t_l: ${sML}`
        ); */

/*                 printer.print(
            "Simulation", 
            `t: ${t} | s_r/l_r: ${shortestRoute}/${longestRoute} | ${active} | ${fSR} | t_r: ${fR}ms | t_l: ${sML}`
        ); */

async function handleSimulate(sub, rest) {
    try {
        switch (sub.toLowerCase()) {
            case "start":
                if (rest.length !== 4 && rest.length !== 2) {
                    throw new Error("incorrect number of arguments.")
                }

                const bikes = Number(rest[1])
                if (rest[0] !== "bikes" || (!Number.isInteger(bikes) || bikes <= 0)) {
                    throw new Error("expected 'bikes <+Int>'")
                }

                configuration.simulationBikeLimit = bikes;
                
                if (rest.length === 4) {
                    const routes = Number(rest[3])
                    if(rest[2] !== "routes" || (!Number.isInteger(routes) || routes <= 0)) {
                        throw new Error("expected 'routes <+Int>'")
                    }
                    configuration.simulationReRouteLimit = routes;
                    
                } else {
                    configuration.simulationReRouteLimit = helpers.constants.SIMULATION_REROUTE_LIMIT;
                }

                await initializeBikes();
                startBroadcast();
                startSimulation(rest[2] === "routes");
                break;

            case "status":
                console.log("status");
                break;

            case "stop":
                console.log("stop")
                break;

            default: 
                console.log("Invalid command")
                return;
        }
    } catch (e) {
        console.log("Command failed: ", e.message);
        return
    }

}

function commandLine() {

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true
    })

    rl.setPrompt("> ")
    rl.prompt()
    
    rl.on("line", async (input) => {
        const commands = helpers.splitCommand(input)
        const [command, subcommand, ...rest] = commands
        
        switch (command.toLowerCase()) {
            case "simulate":
                handleSimulate(subcommand, rest);
                break;

            case "set":
                handleSet(subcommand, rest)
            case "help":
                console.log(helpers.constants.HELP);
                break;

            case "exit":
                console.log("Shutting down server.");
                rl.close();
                process.exit(0);

            default: 
                console.log("Unkown command")
                break;
        }

        rl.prompt();
    });
}

process.on("SIGINT", () => {
    process.exit(0);
})

process.on("SIGTERM", () => {
    process.exit(0);
})
                
module.exports = server;
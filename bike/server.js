require("dotenv").config();
const express = require("express");
const io = require("socket.io-client");
const Bike = require("./bike");
const helpers = require("./utils/helpers")
const {constants} = require("./utils/constants");
const calculations = require("./utils/calculations");
const printer = require("./utils/print")
const axios = require("axios");
const readline = require("readline");

const app = express();
app.use(express.json());

const port = process.env.BIKE_SERVER_PORT;
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
    broadcastRate: constants.BROADCAST_RATE || 5000,
    simulationRate: constants.SIMULATION_RATE || 5000,
    simulationBikeLimit: constants.BIKE_LIMIT || bikes.size,
    simulationMoveLimit: constants.SIMULATION_MOVE_LIMIT,
    simulationReRouteLimit: constants.SIMULATION_REROUTE_LIMIT,
    verbose: false
}

async function connectToBackend() {
    
    return new Promise((resolve, reject) => {
        let totalAttempts = 0;
        printer.print("Socket", `Connecting to backend websocket via ${API}`)
        
        socket = io(API, {
            reconnection: true,
            reconnectionDelay: constants.RETRY_DELAY,
            reconnectionAttempts: constants.MAX_RETRY,
            transports: ["websocket", "polling"],
            timeout: constants.RETRY_DELAY * 5
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
            printer.print("Socket", `Could not connect to ${API}. ${totalAttempts}/${constants.MAX_RETRY}`);
            printer.print("Socket", e.message);
            
            if (totalAttempts >= constants.MAX_RETRY) {
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
        //console.log(allBikes)
        for (const bikeData of allBikes) {
            if (bikeData.position) {
                const bikeID = bikeData._id;
                startNewBike(bikeID, bikeData);
            }
        }
        printer.print("Server", `Mapped: ${bikes.size} bikes.`)
        printer.print("Server", "Bikes initialized.")
    } catch (e) {
        //console.log(e.stack)
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



async function setRandomRoute(bike) {
    try {
        const randomStation = stations[Math.floor(Math.random() * stations.length)];
        const start = bike.position;
        const end = randomStation.position;

        const {route, distance} = await helpers.getRoute(start, end);
        
        bike.initSimulationRun(
            route, 
            distance, 
            randomStation.stationName, 
            bike.currentZoneName ?? null, 
            bike.currentZoneID ?? null, 
            bike.currentStationName ?? null, 
            bike.currentStationID ?? null
        )
    } catch (e) {
        throw new Error(e);
    }
}

async function setRandomRoutes() {

    for(const [_, bike] of bikes) {
        try {
            //console.log(bike)
            await setRandomRoute(bike);
        } catch (e) {
            printer.print("Server: warn", `Bike routing error: ${e.message}`);
            continue;
        }
    }
}

function createSimulationIntervalSingle() {
    finishedSimulatedRoutes = 0;
    longestRoute = calculations.findLongestRoute(bikes);
    shortestRoute = calculations.findShortestRoute(bikes);

    simulationInterval = setInterval(async () => {
        
        const log = {
            tick: simulationMoveCounter,
            shortestRoute: shortestRoute,
            longestRoute: longestRoute,
            finishedBikes: finishedSimulatedRoutes,
            status: "",
            errors: [],
            active: (bikes.size - finishedSimulatedRoutes)
        }

        if (checkIfDone()) {
            log.status = `Ending simulation, passed tick-limit (${simulationMoveCounter}/${configuration.simulationMoveLimit})`;
            stopSimulationSingle();
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
                    
                    const nearbyStation = calculations.locateCloseStation(bikeLat, bikeLong, stations);
                    if (nearbyStation) {
                        bike.setStationInformation(nearbyStation.stationName, nearbyStation.stationID);
                    } else {
                        bike.setStationInformation(null, null);
                    }

                    const zone = calculations.locateZone(bikeLat, bikeLong, zones);
                    if (zone) {
                        bike.setZoneInformation(zone.zoneName, zone.zoneID);
                    } else {
                        bike.setZoneInformation(null, null);
                    }

                    const snapshots = bike.getSimulationRunSnapshots()
                    const distance = calculations.calculateDistance(snapshots);
                    bike.setSimulationRunDone(distance, simulationMoveCounter);
                    
                    finishedSimulatedRoutes++;
                    stopRides(bike);
                    //console.log(bike)
                    break;
                case 2:
                    // steps left
                    log.status = "Running."
                    break;
            }
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
            stopSimulationSingle();
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
    longestRoute = calculations.findLongestRoute(bikes);
    shortestRoute = calculations.findShortestRoute(bikes);

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
                    
                    const nearbyStation = calculations.locateCloseStation(bikeLat, bikeLong, stations);
                    if (nearbyStation) {
                        bike.setStationInformation(nearbyStation.stationName, nearbyStation.stationID);
                    } else {
                        bike.setStationInformation(null, null);
                    }

                    const zone = calculations.locateZone(bikeLat, bikeLong, zones);
                    if (zone) {
                        bike.setZoneInformation(zone.zoneName, zone.zoneID);
                    } else {
                        bike.setZoneInformation(null, null);
                    }

                    const snapshots = bike.getSimulationRunSnapshots()
                    const distance = calculations.calculateDistance(snapshots);
                    bike.setSimulationRunDone(distance, simulationMoveCounter);

                    finishedSimulatedRoutes++;
                    stopRides(bike);
                    break;
                case 2:
                    // steps left
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
                longestRoute = calculations.findLongestRoute(bikes);
                shortestRoute = calculations.findShortestRoute(bikes);
                startRides(bike.id);
            } catch (e) {
                log.errors.push(`Bike routing error: ${e.message}`)
            }
        }

        let sampleBikes = []
        for(const bike of bikes.values()) {
            const run = bike.simulationRuns[bike.simulationRunIndex];
            
            if (run && !run.done) {
                sampleBikes.push(
                    {
                        number: bike.number,
                        routeLen: bike.getSimulationRouteLength(),
                        routeStep: bike.getSimulationRouteIndex(),
                        runs: bike.simulationRuns.length
                    }    
                )
                if (sampleBikes.length === 5) break;
            }
        }

        printer.runtimePrintLoop(
            simulationMoveCounter, configuration.simulationMoveLimit, 
            finishedSimulatedRoutes, broadcastToServer,
            configuration.broadcastRate, configuration.simulationRate, 
            shortestRoute, longestRoute, active, bikes.size, sampleBikes
        );

        simulationLog.push(log)
        simulationMoveCounter++;

    }, configuration.simulationRate);   
}

async function startRides(id = null) {
    if (!id) {
        for(const bike of bikes.values()) {
            await helpers.startRide(bike.id, serviceToken, serviceTokenExpiresIn);
        }
    } else {
        await helpers.startRide(id, serviceToken, serviceTokenExpiresIn);
    }
}

async function stopRides(bike = null) {
    let run = bike.simulationRuns[bike.simulationRunIndex];
    let parkingType = helpers.findParkingType(bike, zones);
    await helpers.endRide(bike.id, run.calcDistance, parkingType, serviceToken, serviceTokenExpiresIn);
}


async function startSimulation(loop = false) {
    if (simulationRunning) {
        printer.print("Server: warn", "Simulation is already running.")
        return
    }

    await initializeBikes();
    startBroadcast();
    simulationRunning = true;
    simulationMoveCounter = 0;
    
    await setRandomRoutes();
    console.log("------------------------------------------")
    printer.clearScreen();
    simulationLog = [];
    startRides();

    if (loop) {
        createSimulationIntervalLoop(); 
    } else { 
        createSimulationIntervalSingle(); 
    }
}

function simulationTearDown() {
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
    
    helpers.storeSimulation(
        simulationMoveCounter, 
        bikes.size,
        finishedSimulatedRoutes,
        configuration,
        serviceToken,
        serviceTokenExpiresIn
    );

    // final transmission
    for(const [_, bike] of bikes) {
        if(socket && socket.connected) {
            socket.emit("bike-update", bike)
            bike.setBroadcast(new Date());
        }
    }

    stopBroadcast();
}

function stopSimulationSingle() {
    simulationTearDown();
    printer.simulationRecapSingle(bikes, finishedSimulatedRoutes, simulationLog);
}

function stopSimulationLoop() {
    simulationTearDown();
    printer.simulationRecapLoop(bikes, configuration, finishedSimulatedRoutes, simulationMoveCounter)
}

function forceStopSimulation() {
    if (!simulationRunning) {
        printer.print("Server: warn", "No simulation running.")
        return
    }

    // reset bikes 
    for(const [_, bike] of bikes) {
        bike.simulationForceExit()
        if(socket && socket.connected) {
            socket.emit("bike-update", bike)
            bike.setBroadcast(new Date());
        } 
    }

    printer.print("Simulation", "Stopping simulation.")
    printer.print("Simulation", "No data stored with forceful exit.")
    printer.print("Simulation", "You may still be able to view logged data with 'simulate result' (until next simulation)")
    
    simulationRunning = false;
    clearInterval(simulationInterval);
    stopBroadcast();
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

function handleSet(sub, rest) {
    try {
        if(rest.length !== 1) {
            throw new Error("incorrect number of arguments.")
        }

        const choice = rest[0];
        const val = Number(choice);

        switch (sub.toLowerCase()) {

            case "broadcastenable":
                if(choice === "true") {
                    printer.print("Server", `Broadcast enabled`);
                    configuration.broadcastEnable = true;
                } else if (choice === "false") {
                    printer.print("Server", `Broadcast disabled`);
                    configuration.broadcastEnable = false;
                } else {
                    throw new Error("expected true/false");
                }

                break;

            case "broadcastrate":
                if ((!Number.isInteger(val) || val < 1000)) {
                    throw new Error("expected 'broadcastRate <atleast 1000ms>'")
                }
                configuration.broadcastRate = val;
                printer.print("Server", `Broadcast rate set to ${configuration.broadcastRate}ms`);
                break;

            case "tickrate":
                if ((!Number.isInteger(val) || val < 100)) {
                    throw new Error("expected 'tickRate <atleast 100ms>'")
                }
                configuration.simulationRate = val;
                printer.print("Server", `Tickrate set to ${configuration.simulationRate}ms`);
                break;
            
            case "ticklimit":
                if ((!Number.isInteger(val) || val < 200)) {
                    throw new Error("expected 'tickLimit <atleast 500>'")
                }
                configuration.simulationMoveLimit = val;
                printer.print("Server", `tickLimit set to ${configuration.simulationMoveLimit}`);
                break;

            default: 
                console.log("Invalid command");
                return;
        }
    } catch (e) {
        console.log("Command failed: ", e.message);
        return
    }    
}

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
                    configuration.simulationReRouteLimit = constants.SIMULATION_REROUTE_LIMIT;
                }
                startSimulation(rest[2] === "routes");
                break;

            case "stop":
                forceStopSimulation();
                break;

            case "log":
                printer.logDump(simulationLog);
                break;

            default: 
                console.log("Invalid command");
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
                break;

            case "config":
                printer.config(configuration);
                break;

            // this would be normal operation if there were real life bikes.
            // defualt is for the simulation to do this and then clear it when done.
            case "enable":
                await initializeBikes();
                startBroadcast();
                break;

            case "help":
                console.log(constants.HELP);
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
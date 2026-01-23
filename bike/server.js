require("dotenv").config();
const express = require("express");
const io = require("socket.io-client");
const Simulation = require("./simulation");
const helpers = require("./utils/helpers")
const {constants} = require("./utils/constants");

const printer = require("./utils/print")
const axios = require("axios");
const readline = require("readline");

const app = express();

app.use(express.json());


const port = process.env.BIKE_SERVER_PORT;
const API = process.env.BASE_API_URL || "http://backend:3000";

let server;
let simulation = null;
let socket;
let serviceToken = null;
let serviceTokenExpiresIn = 0;
let zones = [];
let stations = [];
const bikes = new Map();


let configuration = {
    broadcastEnable: true,
    broadcastRate: constants.BROADCAST_RATE || 5000,
    simulationRate: constants.SIMULATION_RATE || 5000,
    simulationBikeLimit: bikes.size,
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
        });

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

async function enableDefaultServerFunctionality() {
    try {
        await connectToBackend();
        await getStations();
        await getZones();
    } catch (e) {
        throw new Error(e.message);
    }
}

async function startSimulation(loop = false) { 
    if (simulation) {
        printer.print("Server: warn", "Simulation is already running.")
        return
    }

    simulation = new Simulation(stations, zones, socket, configuration);
    simulation.startSimulation(loop)
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
                if (simulation) {
                    simulation.forceStopSimulation();
                } else {
                    printer.print("Server", "No simulation running.")
                }
                break;

            case "log":
                if (simulation) {
                    printer.logDump(simulation.simulationLog);
                } else {
                    printer.print("Server", "No simulation running.")
                }
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
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

let socket;
let server;
let serviceToken = null;
let serviceTokenExpiresIn = 0;

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

async function startBike(id) {

}

async function initializeBikes() {
    try {
        const res = await helpers.getServiceToken(serviceToken, serviceTokenExpiresIn)
        serviceToken = res.token;
        serviceTokenExpiresIn = res.expiry;
        helpers.print("Server", "Getting bike data from backend.")
        const response = await axios.get(`${API}/api/v1/service/bikes`, {
            headers: {
                "x-access-token": serviceToken
            }
        });
        
        //console.log(response.data.data);
        const allBikes = response.data.data
        if (!Array.isArray(allBikes) || allBikes.length === 0) {
            helpers.print("Server", "No bikes found.")
            return;
        }
        helpers.print("Server", `Found ${allBikes.length} bikes.`)

        if(!socket || !socket.connected) {
            throw new Error("No socket connection to backend.")
        }

        for (const bikeData of allBikes) {
            if (bikeData.position) {
                const bikeID = bikeData._id;
                bikes.set(bikeID, new Bike(bikeData));
                socket.emit("bike-connect", {
                    id: bikeID
                });
            }
        }

    } catch (e) {
        helpers.print("Server", `Could not initialize bikes. Error: ${e.message}`)
    }
}

function startBroadcast() {
    setInterval(() => {
        for(const [_, bike] of bikes) {
            // check if movement else skip?
            // use bike.log.lastUpdate to check? 
            if(socket && socket.connected) {
                socket.emit("bike-update", bike)
            }
        }
    }, helpers.constants.BROADCAST_RATE)
    return;
}

async function enableServerFunctionality() {
    await connectToBackend();
    helpers.print("Server", "Initializing bikes.")
    await initializeBikes();
    helpers.print("Server", "Bikes initialized.")
    startBroadcast();
    //console.log(bikes);
}

async function startBikeServer() {
    try {
        await enableServerFunctionality();
        
        app.listen(port, async () => {
            helpers.print("Server", `Bike server running on port ${port}`)
        })
    } catch (e) {
        helpers.print("Server", `Startup failed: ${e.message}`)
        process.exit(1);
    }
}

startBikeServer();

module.exports = server;
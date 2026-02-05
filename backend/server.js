const app = require("./app");
const initDB = require("./utils/initDB");
const {Server} = require("socket.io")
require("dotenv").config();
const { ObjectId } = require('mongodb');
const database = require('./database/database');
const helpers = require("./utils/helpers");

const port = process.env.PORT || 3000;
let server;
let io;
let updateCounter = 0;
let lastUpdate = null;

(async () => {
    try {
        if (process.env.NODE_ENV !== "test") {
            await initDB();
            helpers.print("Database", "initiated");
        }
        
        server = app.listen(port, () => {helpers.print("Server", `API running on port ${port}`)});
        helpers.print("Server", `Logging will start, updates each ${helpers.LOG_DELAY/1000}s`);
        const clients = new Map()
        const socketToBike = new Map()

        io = new Server(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        })

        setInterval(() => {
            console.log("-----------------------------------------")
            helpers.print("Log", `Current bike count: ${clients.size}`)
            if (updateCounter > 0) {
                helpers.print("Log", `Updated: ${updateCounter} bikes since last log.`)
                helpers.print("Log", `Last update: ${lastUpdate.toString().substr(0, 24)}`)
            }
            updateCounter = 0;
        }, helpers.LOG_DELAY);

        io.on("connection", (socket) => {

            socket.on("bike-connect", (data) => {
                const bikeID = data.id;
                clients.set(bikeID, socket.id)
                socketToBike.set(socket.id, bikeID)
                socket.data.type = "bike";
            });

            socket.on("client-connect", () => {
                console.log("Client connected.")
                socket.data.type = "client";
            });

            socket.on("bike-update", async (data) =>{
                const bikeID = data.id;
                try {
                    const position = data.position;
                    const battery = Number(data.battery.toFixed(2));
                    const status = data.status;
                    const currentStationID = data.currentStationID;
                    const currentStationName = data.currentStationName;
                    const currentZoneID = data.currentZoneID;
                    const currentZoneName = data.currentZoneName;

                    const db = await database.getDb("bikes");
                    await db.collection.updateOne(
                        {_id: new ObjectId(bikeID)},
                        {
                            $set: {
                                position: position,
                                battery: battery,
                                updatedAt: new Date(),
                                status: status,
                                currentStation: currentStationID,
                                currentStationName: currentStationName,
                                currentZone: currentZoneID,
                                currentZoneName: currentZoneName,
                            }
                        }
                    );
                    //console.log(`[Socket] Bike with ID: ${bikeID} updated in database.`)
                    io.emit("bike-position", {
                        bikeID: bikeID,
                        position: position,
                        battery: battery,
                        status: status,
                        broadcastAt: new Date()
                    })
                    //console.log(`[Socket] Bike with ID: ${bikeID} broadcasted.`)
                    await db.client.close();
                    updateCounter++;
                    lastUpdate = new Date();
                } catch (e) {
                    helpers.print("Socket", `Something went wrong when updating bike with ID: ${bikeID}`);
                    helpers.print("Socket", `${e.message}`);
                    io.emit("error", "Could not update bike")
                }
            });

            socket.on("disconnect", () => {
                if (socket.data.type === "bike") {
                    const bikeID = socketToBike.get(socket.id);
                    clients.delete(bikeID);
                    socketToBike.delete(socket.id);
                    helpers.print("Socket", `Disconnected bike with ID: ${bikeID}`);
                } else if (socket.data.type === "client") {
                    helpers.print("Socket", `Disconnected client with ID: ${socket.id}`);
                }
            })

            socket.on("error", (e) => {
                helpers.print("Socket", `Error from socket with ID: ${socket.id}. Bike ID: ${socketToBike.get(socket.id)}`);
                helpers.print("Socket", `Error: ${e}`);
            })
        });
    } catch (e) {
        helpers.print("Server", "Could not start server.");
        helpers.print("Server", e);
        process.exit(1);
    }
})();

module.exports = server;

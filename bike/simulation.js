const axios = require("axios");

const helpers = require("./utils/helpers");
const calculations = require("./utils/calculations");
const Bike = require("./bike");
const printer = require("./utils/print")
const API = process.env.BASE_API_URL || "http://backend:3000";

class simulation {
    constructor(stations, zones, socket, configuration) {
        this.bikes = new Map();
        this.stations = stations;
        this.zones = zones;
        this.simulationLog = [];
        this.socket = socket;
        this.configuration = configuration;
        this.serviceToken = null;
        this.serviceTokenExpiresIn = 0;
        this.simulationRunning = false;
        this.simulationInterval = null;
        this.simulationMoveCounter = 0;
        this.broadcastInterval = null;
        this.finishedSimulatedRoutes = 0;
        this.longestRoute = 0;
        this.shortestRoute = Infinity;
        this.broadcastToServer = 0;
        this.log = {errors:[]};
    }

    startBroadcast() {
        this.broadcastToServer = 0;
        if (this.configuration.broadcastEnable) {
            this.broadcastInterval = setInterval(() => {
                for(const [_, bike] of this.bikes) {
        
                    const lastUpdate = bike?.lastUpdate?.getTime() || 0;
                    const lastBroadcast = bike.broadcast?.getTime() || 0;
                    
                    if(this.socket && this.socket.connected) {
                        if (lastBroadcast < lastUpdate) {
                            this.socket.emit("bike-update", bike)
                            bike.setBroadcast(new Date());
                            this.broadcastToServer++;
                        }
                    } 
                }
            }, this.configuration.broadcastRate)
            return
        } 
        return;

    }

    stopBroadcast() {
        if (!this.broadcastInterval) {
            printer.print("Server: warn", "No active broadcast.")
            return
        }
        printer.print("Server", "Stopping broadcast.")
        clearInterval(this.broadcastInterval);
    }


    async initializeBikes() {
        try {
            this.bikes = new Map();

            printer.print("Server", "Initializing bikes.")
            const res = await helpers.getServiceToken(this.serviceToken, this.serviceTokenExpiresIn)

            this.serviceToken = res.token;
            this.serviceTokenExpiresIn = res.expiry;

            printer.print("Server", "Getting bike data from backend.")
            const response = await axios.get(`${API}/api/v1/service/bikes`, {
                headers: {
                    "x-access-token": this.serviceToken
                }
            });

            let allBikes = response.data.data
            if (!Array.isArray(allBikes) || allBikes.length === 0) {
                printer.print("Server: warn", "No bikes found.")
                return;
            }
            
            if(!this.socket || !this.socket.connected) {
                throw new Error("No socket connection to backend.")
            }
            
            const limit = this.configuration.simulationBikeLimit;
            if (limit > 0) {
                allBikes = allBikes.slice(0, limit)
                printer.print("Server", `Set bike limit to: ${limit}/${allBikes.length}`)
            }

            for (const bikeData of allBikes) {
                if (bikeData.position) {
                    const bikeID = bikeData._id;
                    this.startNewBike(bikeID, bikeData);
                }
            }
            printer.print("Server", `Mapped: ${this.bikes.size} bikes.`)
            printer.print("Server", "Bikes initialized.")
        } catch (e) {
            printer.print("Server: warn", `Could not initialize bikes. Error: ${e.message}`)
        }
    }


    startNewBike(id, data) {
        try {
            this.bikes.set(id, new Bike(data));
            this.socket.emit("bike-connect", {
                id: id
            });
        } catch (e) {
            printer.print("Server: warn", `Could not initialize bike with ID: ${id}. Error: ${e.message}`)
        }
    }

    async setRandomRoute(bike) {
        try {
            const randomStation = this.stations[Math.floor(Math.random() * this.stations.length)];
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

    async setRandomRoutes() {

        for(const [_, bike] of this.bikes) {
            try {
                await this.setRandomRoute(bike);
            } catch (e) {
                printer.print("Simulation: warn", `Bike routing error: ${e.message}`);
                continue;
            }
        }
    }

    /**
     * Main logic for simulating bikes. Creates an interval that continuosly updates the bikes status and properties.
     * Used when running 'simulate start bikes <number>'
     */
    createSimulationIntervalSingle() {
        this.finishedSimulatedRoutes = 0;
        this.longestRoute = calculations.findLongestRoute(this.bikes);
        this.shortestRoute = calculations.findShortestRoute(this.bikes);

        this.simulationInterval = setInterval(async () => {
            const stopRidesPromises = [];

            const log = {
                tick: this.simulationMoveCounter,
                shortestRoute: this.shortestRoute,
                longestRoute: this.longestRoute,
                finishedBikes: this.finishedSimulatedRoutes,
                status: "",
                errors: [],
                active: (this.bikes.size - this.finishedSimulatedRoutes)
            }

            if (this.checkIfDone()) {
                this.log.status = `Ending simulation, passed tick-limit (${this.simulationMoveCounter}/${this.configuration.simulationMoveLimit})`;
                this.simulationLog.push(log)
                this.stopSimulationSingle();
                return;
            }

            for(const bike of this.bikes.values()) {
                
                // skip if bike is done.
                if (bike.simulationRuns[bike.simulationRunIndex].done) {
                    continue;
                }

                const res = bike.moveBy();

                switch (res.status) {
                    case 0:
                        this.log.errors.push(`B${bike.number} attempted to move without route!`) 
                        break;
                    case 1:
                        // finish
                        const bikeLat = bike.position.lat;
                        const bikeLong = bike.position.long;
                        
                        const nearbyStation = calculations.locateCloseStation(bikeLat, bikeLong, this.stations);
                        if (nearbyStation) {
                            bike.setStationInformation(nearbyStation.stationName, nearbyStation.stationID);
                        } else {
                            bike.setStationInformation(null, null);
                        }

                        const zone = calculations.locateZone(bikeLat, bikeLong, this.zones);
                        if (zone) {
                            bike.setZoneInformation(zone.zoneName, zone.zoneID);
                        } else {
                            bike.setZoneInformation(null, null);
                        }

                        const run = bike.simulationRuns[bike.simulationRunIndex];
                        const distance = calculations.twoPointDistance(run.endStamp.startPos.lat, run.endStamp.startPos.long, bike.position.lat, bike.position.long);
                        bike.setSimulationRunDone(distance, this.simulationMoveCounter);
                        this.finishedSimulatedRoutes++;
                        
                        stopRidesPromises.push(
                            this.stopRides(bike).catch(err => {
                                console.error(`Failed to stop rides for bike ${bike.number}:`, err);
                                this.log.errors.push(`Failed to stop rides for B${bike.number}: ${err.message}`);
                            })
                        );

                        break;
                    case 2:
                        // steps left
                        this.log.status = "Running."
                        break;
                }
            }

            await Promise.all(stopRidesPromises);

            printer.runtimePrint(
                this.simulationMoveCounter, this.configuration.simulationMoveLimit, 
                this.finishedSimulatedRoutes, this.bikes.size, this.broadcastToServer,
                this.configuration.broadcastRate, this.configuration.simulationRate, 
                this.shortestRoute, this.longestRoute
            );

            if (this.finishedSimulatedRoutes === this.bikes.size) {
                this.log.status = `All ${this.bikes.size} bikes finished their routes.`
                this.simulationLog.push(log)
                this.stopSimulationSingle();
                return;
            }

            this.simulationLog.push(log)

            this.simulationMoveCounter++;      
        }, this.configuration.simulationRate);
    }

    checkIfDone() {

        for(const bike of this.bikes.values()) {
            const run = bike.simulationRuns[bike.simulationRunIndex];
            if(!run) {
                return false;
            }

            if (!run.done) {
                return false
            }

            if (bike.simulationRuns.length < this.configuration.simulationReRouteLimit && 
                this.simulationMoveCounter < this.configuration.simulationMoveLimit
            ) {
                return false;                        
            }
        }
        return true;

    }

    /**
     * Main logic for simulating bikes. Creates an interval that continuosly updates the bikes status and properties.
     * Used when running 'simulate start bikes <number>'
     */
    createSimulationIntervalLoop() {
        this.finishedSimulatedRoutes = 0;
        this.longestRoute = calculations.findLongestRoute(this.bikes);
        this.shortestRoute = calculations.findShortestRoute(this.bikes);

        this.simulationInterval = setInterval(async () => {

            let active = 0;
            for (const bike of this.bikes.values()) {
                const run = bike.simulationRuns[bike.simulationRunIndex];
                if(!run) {
                    continue;
                } 
                if (!run.done) {
                    active++;
                }
            }

            const log = {
                tick: this.simulationMoveCounter,
                shortestRoute: this.shortestRoute,
                longestRoute: this.longestRoute,
                finishedBikes: this.finishedSimulatedRoutes,
                status: "",
                active: active,
                errors: []
            }
        
            if (this.checkIfDone()) {
                //this.log.status = `Ending simulation, passed tick-limit (${this.simulationMoveCounter}/${this.configuration.simulationMoveLimit})`;
                this.stopSimulationLoop();
                return;
            }

            for(const bike of this.bikes.values()) {
                const run = bike.simulationRuns[bike.simulationRunIndex];

                if(!run) {
                    this.log.errors.push(`Bike ${bike.number} has invalid run index ${bike.simulationRunIndex}`)
                    continue;
                } 

                // new route needed
                if (run.done) {
                    if (bike.simulationRuns.length < this.configuration.simulationReRouteLimit && 
                        this.simulationMoveCounter < this.configuration.simulationMoveLimit
                    ) {
                        bike.reRouteNeeded = true;                        
                    }
                    continue;
                }

                const res = bike.moveBy();

                switch (res.status) {
                    case 0:
                        this.log.errors.push(`B${bike.number} attempted to move without route!`) 
                        break;
                    case 1:
                        const bikeLat = bike.position.lat;
                        const bikeLong = bike.position.long;
                        
                        const nearbyStation = calculations.locateCloseStation(bikeLat, bikeLong, this.stations);
                        if (nearbyStation) {
                            bike.setStationInformation(nearbyStation.stationName, nearbyStation.stationID);
                        } else {
                            bike.setStationInformation(null, null);
                        }

                        const zone = calculations.locateZone(bikeLat, bikeLong, this.zones);
                        if (zone) {
                            bike.setZoneInformation(zone.zoneName, zone.zoneID);
                        } else {
                            bike.setZoneInformation(null, null);
                        }

                        const distance = calculations.twoPointDistance(run.endStamp.startPos.lat, run.endStamp.startPos.long, bike.position.lat, bike.position.long);
                        bike.setSimulationRunDone(distance, this.simulationMoveCounter);

                        this.finishedSimulatedRoutes++;
                        await this.stopRides(bike);
                        break;
                    case 2:
                        // steps left
                        break;
                }
            }
            
            for(const bike of this.bikes.values()) {
                if (!bike.reRouteNeeded) {
                    continue;
                }
                try {
                    bike.simulationRunIndex++;
                    await this.setRandomRoute(bike);
                   /*  longestRoute = calculations.findLongestRoute(this.bikes);
                    shortestRoute = calculations.findShortestRoute(this.bikes); */
                    bike.reRouteNeeded = false;
                    await this.startRides(bike);
                } catch (e) {
                    this.log.errors.push(`Bike routing error: ${e.message}`)
                }
            }

            let sampleBikes = []
            for(const bike of this.bikes.values()) {
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
                this.simulationMoveCounter, this.configuration.simulationMoveLimit, 
                this.finishedSimulatedRoutes, this.broadcastToServer,
                this.configuration.broadcastRate, this.configuration.simulationRate, 
                this.shortestRoute, this.longestRoute, active, this.bikes.size, sampleBikes
            );

            this.simulationLog.push(log)
            this.simulationMoveCounter++;

        }, this.configuration.simulationRate);   
    }

    async startRides(bike = null) {

        if (!bike) {
            let count = 0;
            for(const bike of this.bikes.values()) {
                let res = await helpers.startRide(bike.id, this.serviceToken, this.serviceTokenExpiresIn);
                bike.rideID = res.data.data.rideID;
                count++
                printer.staticPrint(`${count}/${this.bikes.size} bikes have been rented.`);
            }
        } else {
            let res = await helpers.startRide(bike.id, this.serviceToken, this.serviceTokenExpiresIn);
            bike.rideID = res.data.data.rideID;
        }
    }

    async stopRides(bike = null) {
        let run = bike.simulationRuns[bike.simulationRunIndex];
        let parkingType = helpers.findParkingType(bike, this.zones);
        await helpers.endRide(bike.id, bike.rideID, run.calcDistance, parkingType, this.serviceToken, this.serviceTokenExpiresIn);
    }

    async startSimulation(loop = false) {
        if (this.simulationRunning) {
            printer.print("Server: warn", "Simulation is already running.")
            return
        }
        await this.initializeBikes();
        await this.startRides();
        this.startBroadcast();

        this.simulationRunning = true;
        this.simulationMoveCounter = 0;
        
        await this.setRandomRoutes();
        console.log("------------------------------------------")
        this.simulationLog = [];
        
        if (loop) {
            printer.clearScreen(9);
            this.createSimulationIntervalLoop(); 
        } else { 
            printer.clearScreen(11);
            this.createSimulationIntervalSingle(); 
        }
    }

    stopSimulationSingle() {
        this.simulationTearDown();
        printer.simulationRecapSingle(this.bikes, this.finishedSimulatedRoutes, this.simulationLog);
    }

    stopSimulationLoop() {
        this.simulationTearDown();
        printer.simulationRecapLoop(this.bikes, this.configuration, this.finishedSimulatedRoutes, this.simulationMoveCounter)
    }

    simulationTearDown() {
        if (!this.simulationRunning) {
            printer.print("Server: warn", "No simulation running.")
            return
        } 
        this.stopBroadcast();
        const status = this.simulationLog[this.simulationLog.length - 1].status
        if (status) {
            printer.print("Simulation", status)
        } else {
            printer.print("Simulation", "Stopping simulation.")
        }

        this.simulationRunning = false;
        clearInterval(this.simulationInterval);
        
        helpers.storeSimulation(
            this.simulationMoveCounter, 
            this.bikes.size,
            this.finishedSimulatedRoutes,
            this.configuration,
            this.serviceToken,
            this.serviceTokenExpiresIn
        );

        // final transmission
        for(const [_, bike] of this.bikes) {
            if(this.socket && this.socket.connected) {
                this.socket.emit("bike-update", bike)
                bike.setBroadcast(new Date());
            }
        }


    }

    async forceStopSimulation() {
        for(const bike of this.bikes.values()) {
            await this.stopRides(bike);
        }

        this.stopBroadcast();
        // reset bikes 
        for(const [_, bike] of this.bikes) {
            bike.simulationForceExit()
            if(this.socket && this.socket.connected) {
                socket.emit("bike-update", bike)
                bike.setBroadcast(new Date());
            } 
        }

        printer.print("Simulation", "Stopping simulation.")
        printer.print("Simulation", "No data stored with forceful exit.")
        printer.print("Simulation", "You may still be able to view logged data with 'simulate result' (until next simulation)")
        
        this.simulationRunning = false;
        clearInterval(this.simulationInterval);

    }

    getBikeInfo(number) {
        let findBike = null;
        for(const bike of this.bikes.values()) {
            if (bike.number === Number(number)) {
                findBike = bike;
                break; 
            }
        }
        this.print = false;
        console.clear()
        if (findBike) {
            console.log(`Bike: ${findBike.number}`)
            console.log(`Number of routes: ${findBike.simulationRuns.length}`)
            for (const run of findBike.simulationRuns) {
                console.log("-----------------------------------------")
                console.log(`Route length: ${run.route.length}`)
                console.log(`Pre calculated distance: ${run.preDefinedRouteDistance}`)
                console.log(`End calculated distance: ${run.calcDistance ?? "N/A"}`)
                console.log(`Expected end station: ${run.expectedEndStation}}`)
                console.log(`Done: ${run.done}`)
                console.log(`Start station: ${run.endStamp ? run.endStamp.startStationName : "N/A"}`)
                console.log(`Start zone: ${run.endStamp ? run.endStamp.startZoneName : "N/A"}`)
                console.log(`End station: ${run.endStamp ? run.endStamp.endStationName : "N/A"}`)
                console.log(`End zone: ${run.endStamp ? run.endStamp.endZoneName : "N/A"}`)
                console.log(`End pos: ${run.endStamp ? run.endStamp.endPos : "N/A"}`)
                console.log(`Start pos: ${run.endStamp ? run.endStamp.startPos : "N/A"}`)
            }
            return
        }

        console.log(`\nBike '${number}' not found.`)

    }

    getBikeNums() {
        let s = [];
        for (const bike of this.bikes.values()) {
            s.push(bike.number);
        }
        console.log(`\n\n${s}`);

        return;
    }

}


module.exports = simulation;
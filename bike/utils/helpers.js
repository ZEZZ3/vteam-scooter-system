require("dotenv").config();
const axios = require("axios");
const printer = require("./print")
const routeURL = process.env.ROUTE_URL;

const constants = {}
constants.STOCKHOLM_LAT_MAX = 59.360000;
constants.STOCKHOLM_LAT_MIN = 59.270000;
constants.STOCKHOLM_LONG_MAX = 18.210000;
constants.STOCKHOLM_LONG_MIN = 17.900000;

constants.MAX_RETRY = 10;
constants.RETRY_DELAY = 2000;
constants.BROADCAST_RATE = 4000;
constants.EARTH_RADIUS = 6371000;

constants.SIMULATION_RATE = 1000;
constants.BIKE_LIMIT = 200;
constants.SIMULATION_REROUTE_LIMIT = 5;
constants.SIMULATION_MOVE_LIMIT = 4000; // backup if something makes a bike not finish

constants.HELP = `
        Use 'simulate' to start a simulation.
        To start a simulation with X bikes that run Y routes each:
            >   simulate start bikes <X> routes <Y>
        
        **note: this will run X * Y simulations, use reasonable numbers or be ready to wait
        ---

        To start a simulation with X bikes that each run 1 route:
            >   simulate start bikes <X> 
        ---

        To view log of simulation:
            > simulate log
        **note: this result is overwritten every time the simulation starts, 
                simulation recap history is accesible on the admin page.
        ---

        To stop a simulation:
            >   simulate stop
        **note: progress may be lost if simulation isnt finished. this is a forceful exit.
        ---

        Use 'set' to configure:
            >   set 'parameter' <value>
        Available parameters: 
            - broadcastEnable: <true/false> (default=true)
            - broadcastRate: <rate in ms> (default=4000)
            - tickrate: <rate in ms> (default=1000)
            - tickLimit: max simulation tick (default=4000)
        ---

        Use 'config' to see configuration:
            >   config 

        Use 'enable' to enable broadcast of all bikes:
            >   enable

        Use 'exit' to terminate server:
            >   exit
        `

function splitCommand(input) {
    return input.trim().split(/\s+/)
}

function toRadians(coord) {
    return coord * Math.PI/180;
}

async function getServiceToken(accessToken = null, tokenExpires = 0) {
    let result = {}
    if (accessToken && Date.now() < tokenExpires) {
        printer.print("Auth", "Service token found.")
        result.token = accessToken;
        result.expiry = tokenExpires;       
        return result;
    }
    const response = await axios.post(`${process.env.BASE_API_URL}/api/v1/service/token`, {
        serviceID: process.env.SERVICE_ID,
        serviceSecret: process.env.SERVICE_SECRET
    });

    result.token = response.data.serviceToken;
    result.expiry = Date.now() + (response.data.expires - 40) * 1000;
    printer.print("Auth", "New service token created.")
    return result;
}

async function storeSimulation(ticks, bikes, finishedRoutes, config, serviceToken, serviceTokenExpiresIn) {
    
    // not storing the bike data since it will be huge with 1000s of bikes...
    // storing it once temporary in the log, which can be printed. will be deleted after re run
    // each logged bike has a route with average size of about 300, 1000 bikes, 1000 ticks = 300M
    
    const res = await getServiceToken(serviceToken, serviceTokenExpiresIn)
    let token = res.token;
    
    const response = await axios.post(`${process.env.BASE_API_URL}/api/v1/service/simulation`,
        {
            ticks: ticks,
            totalBikes: bikes,
            finishedBikes: finishedRoutes,
            finishedAt: new Date(),
            configuration: config,
        },
        {
            headers: {
                "x-access-token": token
            },
        }
    );
    
    if (response.status === 201) {
        printer.print("Server", "Stored simulation in backend.")
    } else {
        printer.print("Server: warn", `Unexpected response from backend: ${response.status}`);
    }
    return response;
}

async function getRoute(start, end) {
    const url = `${routeURL}/route/v1/driving/${start.long},${start.lat};${end.long},${end.lat}?overview=full&geometries=geojson`;
    const result = await axios.get(url);
    const route = result.data.routes[0].geometry.coordinates;
    const distance = result.data.routes[0].distance;
    return {route, distance};
}

// haversine
// https://www.movable-type.co.uk/scripts/latlong.html
function twoPointDistance(lat1, long1, lat2, long2) {
    
    const posLatPhi = toRadians(lat1);
    const stationLatPhi = toRadians(lat2);
    const deltaPhi = toRadians(lat2 - lat1);
    const deltaLambda = toRadians(long2 - long1);
    
    const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) + 
            Math.cos(posLatPhi) * Math.cos(stationLatPhi) *
            Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = constants.EARTH_RADIUS * c;

    return d; 
}

function calculateDistance(travelSteps) {
    let distance = 0;
    for(let i = 0; i < travelSteps.length; i++) {
        const point1 = travelSteps[i].beforeMove;
        const point2 = travelSteps[i].afterMove;
        const d = twoPointDistance(point1.lat, point1.long, point2.lat, point2.long);
        distance += d;
    }

    return distance;
}

// Source - https://stackoverflow.com/a
// Posted by justdvl
// Retrieved 2026-01-05, License - CC BY-SA 4.0
function findPointInZone(lat, long, area) {
    const coords = area.coordinates;
    const point = [lat, long]
    const vertices = coords.map(cord => [cord.lat, cord.long]);
    
    const x = point[0]
    const y = point[1]
    
    let inside = false
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
        const xi = vertices[i][0],
        yi = vertices[i][1]
        const xj = vertices[j][0],
        yj = vertices[j][1]
        
        const intersect = yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
        if (intersect) inside = !inside
    }
    
    return inside
}

function findLongestRoute(bikes) {
    let longest = 0;
    for (const bike of bikes.values()) {
        const len = bike.simulationRuns[bike.simulationRunIndex].route.length;
        if (len > longest) {
            longest = len;
        }
    }
    return longest;
}

function findShortestRoute(bikes) {
    let shortest = Infinity;
    for (const bike of bikes.values()) {
        const len = bike.simulationRuns[bike.simulationRunIndex].route.length;
        if (len < shortest) {
            shortest = len;
        }
    }
    return shortest;
}

// find the closest station based on a station radius. 
// if there is not station within station radius null is returned.
function locateCloseStation(lat, long, stations) {
    let closestStation = null;
    let closestStationDistance = Infinity;
    
    for(const station of stations) {
        const d = twoPointDistance(
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

function locateZone(lat, long, zones) {
    for(const zone of zones) {
        let isInZone = findPointInZone(lat, long, zone.zoneArea)
        if (isInZone) {
            return zone;
        }
    }
    return null;
}

module.exports = {
    constants,
    getServiceToken,
    toRadians,
    twoPointDistance,
    calculateDistance,
    findPointInZone,
    splitCommand,
    findLongestRoute,
    findShortestRoute,
    storeSimulation,
    getRoute,
    locateCloseStation,
    locateZone
}
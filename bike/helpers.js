const axios = require("axios");
/* require("dotenv").config(); */

const constants = {}
constants.STOCKHOLM_LAT_MAX = 59.360000;
constants.STOCKHOLM_LAT_MIN = 59.270000;
constants.STOCKHOLM_LONG_MAX = 18.210000;
constants.STOCKHOLM_LONG_MIN = 17.900000;

constants.MAX_RETRY = 10;
constants.RETRY_DELAY = 2000;
constants.BROADCAST_RATE = 5000;
constants.EARTH_RADIUS = 6371000;

constants.SIMULATION_RATE = 500;
constants.BIKE_LIMIT = 3;
constants.SIMULATION_MOVE_LIMIT = 2000; // backup if something makes a bike not finish


function toRadians(coord) {
    return coord * Math.PI/180;
}

async function getServiceToken(accessToken = null, tokenExpires = 0) {
    let result = {}
    if (accessToken && Date.now() < tokenExpires) {
        print("Auth", "Service token found.")
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
    print("Auth", "New service token created.")
    return result;
}

function getTimeString() {
    const now = new Date();
    const seconds = now.getSeconds().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const hours = now.getHours().toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`
}

function print(source, text) {
    console.log(`${getTimeString()} [${source}] ${text}`);
}

function coordToString(lat, long) {
    return `${lat.toFixed(6)},${long.toFixed(6)}`
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

module.exports = {
    constants,
    getServiceToken,
    print,
    coordToString,
    toRadians,
    twoPointDistance,
    calculateDistance,
    findPointInZone
}
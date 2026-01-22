require("dotenv").config();

const {constants} = require("./constants")

function splitCommand(input) {
    return input.trim().split(/\s+/)
}

function toRadians(coord) {
    return coord * Math.PI/180;
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
/*     console.log(closestStation) */
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
    toRadians,
    twoPointDistance,
    calculateDistance,
    findPointInZone,
    splitCommand,
    findLongestRoute,
    findShortestRoute,
    locateCloseStation,
    locateZone,
}
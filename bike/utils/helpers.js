require("dotenv").config();
const axios = require("axios");
const printer = require("./print")
const routeURL = process.env.ROUTE_URL;
const calculations = require("./calculations")

function splitCommand(input) {
    return input.trim().split(/\s+/)
}

async function getServiceToken(accessToken = null, tokenExpires = 0) {
    let result = {}
    if (accessToken && Date.now() < tokenExpires) {
        //printer.print("Auth", "Service token found.")
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

async function startRide(bikeID, serviceToken, serviceTokenExpiresIn) {
    try {

        const res = await getServiceToken(serviceToken, serviceTokenExpiresIn)
        let token = res.token;
        
        const response = await axios.post(`${process.env.BASE_API_URL}/api/v1/service/rent/start/${bikeID}`,
            {},
            {
                headers: {
                    "x-access-token": token
                },
            }
        );
        
        if (response.status === 201) {
            printer.print("Server", `Started ride for bike: ${bikeID}`)
        } else {
            printer.print("Server: warn", `Unexpected response from backend: ${response.status}`);
        }
        return response;
    } catch(e) {
        printer.print("Server: error", `Could not start ride for ${bikeID}: ${e.code || e.message}`)        
    }
}

async function endRide(bikeID, distance, parkingType, serviceToken, serviceTokenExpiresIn) {
    try {

        const res = await getServiceToken(serviceToken, serviceTokenExpiresIn)
        let token = res.token;
        
        const response = await axios.post(`${process.env.BASE_API_URL}/api/v1/service/rent/stop/${bikeID}`,
            {parkingType: parkingType, distance: distance},
            {
                headers: {
                    "x-access-token": token
                },
                timeout: 5000
            }
        );
        
        if (response.status === 200) {
            printer.print("Server", `Ended ride for bike: ${bikeID}`)
        } else {
            printer.print("Server: warn", `Unexpected response from backend: ${response.status}`);
        }
        return response;
    } catch (e) {
        console.log(e.response.data.error)
        printer.print("Server: error", `Could not end ride for ${bikeID}: ${e.code || e.message}`)
    }
}

async function getRoute(start, end) {
    const url = `${routeURL}/route/v1/driving/${start.long},${start.lat};${end.long},${end.lat}?overview=full&geometries=geojson`;
    const result = await axios.get(url);
    const route = result.data.routes[0].geometry.coordinates;
    const distance = result.data.routes[0].distance;
    return {route, distance};
}

function findParkingType(bike, zones) {
/*     console.log(bike) */
    let parkingType = "station";
    let endStation = bike.endStationName;
    if (!endStation) {
        if(calculations.locateZone(bike.position.lat, bike.position.long, zones)) {
            parkingType = "inZone"
        } else {
            parkingType = "outOfZone"
        }
    }

    return parkingType
}


module.exports = {
    getServiceToken,
    splitCommand,
    storeSimulation,
    getRoute,
    startRide,
    endRide,
    findParkingType
}
"use strict";

const database = require('../database/database');
const bcrypt = require('bcryptjs');
const standardData = require("./standardData.json");
const helpers = require("./helpers");

async function createUsers() {

    helpers.print("Database", "Adding users.")

    let db = await database.getDb("users");
    const minLength = standardData.users.length;
    const currentLength = await db.collection.countDocuments({});
    if (currentLength >= minLength) {
        helpers.print("Database", "Users already exist. Skipping.")
        return;
    }
    
    await db.collection.deleteMany({});

    for (const user of standardData.users) {
        const password = await bcrypt.hash(process.env.TEST_PASSWORD, 10)
        await db.collection.updateOne(
            { mail: user.mail },
            {
                $setOnInsert: {
                    ...user,
                    password: password,
                    createdAt: new Date()
                }
            },
            { upsert: true }
        );
    }

    db.client.close()
    helpers.print("Database", "Users added.")
}

async function createCities() {

    helpers.print("Database", "Adding cities.")
    let db = await database.getDb("cities");

/*     const minLength = standardData.cities.length;
    const currentLength = await db.collection.countDocuments({});
    if (currentLength >= minLength) {
        helpers.print("Database", "Cities already exist. Skipping.")
        return;
    } */


    await db.collection.deleteMany({});
    
    for (const city of standardData.cities) {
        await db.collection.updateOne(
            { name: city.name },
            {
                $setOnInsert: { ...city, createdAt: new Date() }
            },
            { upsert: true }
        );
    }
    db.client.close()
    helpers.print("Database", "Cities added.")
}

async function createZones() {
    
    helpers.print("Database", "Adding zones.")
    let dbZones = await database.getDb("zones");
    let dbCities = await database.getDb("cities");

/*     const minLength = standardData.zones.length;
    const currentLength = await dbZones.collection.countDocuments({});
    if (currentLength >= minLength) {
        helpers.print("Database", "Zones already in exist. Skipping.")
        return;
    } */

    await dbZones.collection.deleteMany({});   

    const cities = await dbCities.collection.find().toArray();

    for (const zone of standardData.zones) {
        const cityObject = cities.find(city => city.name === zone.cityID)        
        await dbZones.collection.updateOne(
            { name: zone.name },
            {
                $setOnInsert: {
                     ...zone,
                     cityID: cityObject._id,
                     createdAt: new Date()
                }
            },
            { upsert: true }
        );
    }
    helpers.print("Database", "Zones added.")    
    helpers.print("Database", "Adding zones references to 'city' collection.")    

    const zones = await dbZones.collection.find().toArray();
    for (const city of cities) {
        // all zones beloning to city
        const cityZones = zones.filter(zone => zone.cityID.toString() === city._id.toString())
        const zoneIDs = cityZones.map(zone => zone._id)

        if (zoneIDs.length > 0) {
            await dbCities.collection.findOneAndUpdate(
                {
                    _id: city._id
                },
                {
                    $push: { zones: { $each: zoneIDs }}
                }
            );
        }
    }

    dbCities.client.close()
    dbZones.client.close()
    helpers.print("Database", "Zones references added to 'city' collection.")    

}

async function createStations() {
    
    helpers.print("Database", "Adding stations.")   
    let dbStations = await database.getDb("stations");
    let dbCities = await database.getDb("cities");
    let dbZones = await database.getDb("zones");

/*     const minLength = standardData.stations.length;
    const currentLength = await dbStations.collection.countDocuments({});
    if (currentLength >= minLength) {
        helpers.print("Database", "Stations already exist. Skipping.")   
        return;
    } */

    await dbStations.collection.deleteMany({});   

    const cities = await dbCities.collection.find().toArray();
    const zones = await dbZones.collection.find().toArray();

    for (const station of standardData.stations) {
        const cityObject = cities.find(city => city.name === station.cityID)        
        const zoneObject = zones.find(zone => zone.name === station.zoneID)        
        
        await dbStations.collection.updateOne(
            { name: station.name },
            {
                $setOnInsert: {
                     ...station,
                     cityID: cityObject._id,
                     zoneID: zoneObject._id,
                     createdAt: new Date()
                }
            },
            { upsert: true }
        );
    }

    helpers.print("Database", "Stations added.")  
    helpers.print("Database", "Adding station references to 'city' collection.")  

    const stations = await dbStations.collection.find().toArray();
    for (const city of cities) {
        // all stations belonging to city
        const cityStations = stations.filter(station => station.cityID.toString() === city._id.toString())
        const stationIDs = cityStations.map(station => station._id)

        if (stationIDs.length > 0) {
            await dbCities.collection.findOneAndUpdate(
                {
                    _id: city._id
                },
                {
                    $push: { stations: { $each: stationIDs }}
                }
            );
        }
    }

    dbCities.client.close()
    dbZones.client.close()
    dbStations.client.close()
    
    helpers.print("Database", "Station references added to 'city' collection.")  
}

async function createBikes() {
    helpers.print("Database", "Adding bikes.")
    
    let dbBikes = await database.getDb("bikes");
    let dbCities = await database.getDb("cities");
    let dbZones = await database.getDb("zones");
    let dbStations = await database.getDb("stations");

    const minLength = standardData.bikes.length;
    const currentLength = await dbBikes.collection.countDocuments({});
    if (currentLength >= minLength) {
        helpers.print("Database", "Bikes already exist. Skipping.")  
        return;
    }
   
    await dbBikes.collection.deleteMany({});

    const cities = await dbCities.collection.find().toArray();
    const zones = await dbZones.collection.find().toArray();
    const stations = await dbStations.collection.find().toArray();

    // map each collections entry name to id/object
    const cityMap = new Map(cities.map(city => [city.name, city._id]))
    const zoneMap = new Map(zones.map(zone => [zone.name, zone._id]))
    const stationMap = new Map(stations.map(station => [station.name, station]))
    
    let currentNum = 1;
    const bikes = [];

    for (const bike of standardData.bikes) {

        const cityID = cityMap.get(bike.city);
        if (!cityID) {
            helpers.print("Database", `Unknown city: ${bike.city}. Skipping bike nr: ${bike.number}.`)  
            continue;
        }

        const zoneID = bike.currentZoneName ? zoneMap.get(bike.currentZoneName) : null;
        const stationID = bike.currentStationName ? stationMap.get(bike.currentStationName)._id: null;
        const stationPos = bike.currentStationName ? stationMap.get(bike.currentStationName).position: null;

        for (let index = 0; index < helpers.BIKES_PER_STATION; index++) {
            bikes.push({
                city: bike.city,
                cityID: cityID,
                currentZoneName: bike.currentZoneName,
                currentZone: zoneID,
                currentStationName: bike.currentStationName,
                currentStation: stationID,
                number: currentNum,
                battery: 100,
                status: "free",
                position: stationPos,
                createdAt: new Date()
            })
            currentNum++;  
        }
    }
        
    await dbBikes.collection.insertMany(bikes)

    dbBikes.client.close()
    dbCities.client.close()
    dbZones.client.close()
    dbStations.client.close()
    helpers.print("Database", "Bikes added.")
}

async function createPayments() {

    helpers.print("Database", "Adding dummy payments.")
    let dbPayments = await database.getDb("payments");
    let dbUsers = await database.getDb("users");
    
/*     const minLength = standardData.payments.length;
    const currentLength = await dbPayments.collection.countDocuments({});
    if (currentLength >= minLength) {
        helpers.print("Database", "Payments already exist. Skipping.")
        return;
    } */

    await dbPayments.collection.deleteMany({});
    
    const users = await dbUsers.collection.find().toArray();

    for (const payment of standardData.payments) {
        const findUser = users.find(user => user.mail === payment.user)
        
        await dbPayments.collection.insertOne(
            {
                user: findUser._id,
                price: payment.price,
                type: payment.type,
                status: payment.status,
                createdAt: new Date()
            },
        );
    }

    dbPayments.client.close();
    dbUsers.client.close();
    helpers.print("Database", "Dummy payments added.")    
}

async function createRides() {

    helpers.print("Database", "Adding dummy rides.")    
    let dbRides = await database.getDb("rides");
    
    /* let dbBikes = await database.getDb("bikes");
    let dbUsers = await database.getDb("users"); */
/*     const minLength = standardData.rides.length;
    
    const currentLength = await dbRides.collection.countDocuments({});
    if (currentLength >= minLength) {
        helpers.print("Database", "Rides already exist. Skipping.")    
        return;
    } */

    await dbRides.collection.deleteMany({});

}

async function initDB() {
    try {
        helpers.print("Database", "Preparing.")
        await createUsers();
        await createCities();
        await createZones();
        await createStations();
        await createBikes();
        await createPayments();
        await createRides();
        helpers.print("Database", "ready.")
    } catch (e) {    
        helpers.print("Database: err", `Database initialization failed: ${e.message}`)
        return new Error(e);
    }
};

module.exports = initDB

"use strict";

const database = require('../database/database');
const bcrypt = require('bcryptjs');
const standardData = require("./standardData.json");

async function createUsers() {

    console.log("Adding users to DB")

    let db = await database.getDb("users");

    const minLength = standardData.users.length;
    const currentLength = await db.collection.countDocuments({});
    if (currentLength >= minLength) {
        console.log("Users already in DB. Skipping.");
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

    console.log("Users added to DB")
}

async function createCities() {

    console.log("Adding cities to DB")

    let db = await database.getDb("cities");

    const minLength = standardData.cities.length;
    const currentLength = await db.collection.countDocuments({});
    if (currentLength >= minLength) {
        console.log("Cities already in DB. Skipping.");
        return;
    }


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
    console.log("Cities added to DB")
}

async function createZones() {
    
    console.log("Adding zones to DB")

    let dbZones = await database.getDb("zones");
    let dbCities = await database.getDb("cities");

    const minLength = standardData.zones.length;
    const currentLength = await dbZones.collection.countDocuments({});
    if (currentLength >= minLength) {
        console.log("Zones already in DB. Skipping.");
        return;
    }


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
    
    console.log("Zones added to DB")
    console.log("Adding zones references to 'city' collection")

    const zones = await dbZones.collection.find().toArray();
    for (const city of cities) {
        cityZones = zones.filter(zone => zone.cityID.toString() === city._id.toString())
        zoneIDs = cityZones.map(zone => zone._id)

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

    console.log("Zones references added to 'city' collection");

}

async function createStations() {
    
    console.log("Adding stations to DB")

    let dbStations = await database.getDb("stations");
    let dbCities = await database.getDb("cities");
    let dbZones = await database.getDb("zones");

    const minLength = standardData.stations.length;
    const currentLength = await dbStations.collection.countDocuments({});
    if (currentLength >= minLength) {
        console.log("Stations already in DB. Skipping.");
        return;
    }

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
    
    console.log("Stations added to DB")
    console.log("Adding station references to 'city' collection")

    const stations = await dbStations.collection.find().toArray();
    for (const city of cities) {
        cityStations = stations.filter(station => station.cityID.toString() === city._id.toString())
        stationIDs = cityStations.map(station => station._id)

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

    console.log("Station references added to 'city' collection");
}

async function createBikes() {
    console.log("Adding bikes to DB")
    
    let dbBikes = await database.getDb("bikes");
    let dbCities = await database.getDb("cities");
    let dbZones = await database.getDb("zones");
    let dbStations = await database.getDb("stations");

    const minLength = standardData.bikes.length;
    const currentLength = await dbBikes.collection.countDocuments({});
    if (currentLength >= minLength) {
        console.log("Bikes already in DB. Skipping.");
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

    for (const bike of standardData.bikes) {
        
        const cityID = cityMap.get(bike.city);
        if (!cityID) {
            console.warn(`Unknown city: ${bike.city}. Skipping bike nr: ${bike.number}.`)
            continue;
        }

        const zoneID = bike.currentZoneName ? zoneMap.get(bike.currentZoneName) : null;
        const stationID = bike.currentStationName ? stationMap.get(bike.currentStationName)._id: null;
        const stationPos = bike.currentStationName ? stationMap.get(bike.currentStationName).position: null;
        
        await dbBikes.collection.updateOne(
            { number: bike.number },
            {
                $setOnInsert: {
                     ...bike, 
                     cityID: cityID,
                     zoneID: zoneID,
                     stationID: stationID,
                     position: stationPos,
                     createdAt: new Date() 
                }
            },
            { upsert: true }
        );
    }

    dbBikes.client.close()
    dbCities.client.close()
    dbZones.client.close()
    dbStations.client.close()
    
    console.log("Bikes added to DB")
}

async function createPayments() {

    console.log("Adding dummy payments to DB")

    let dbPayments = await database.getDb("payments");
    let dbUsers = await database.getDb("users");
    
    const minLength = standardData.payments.length;
    const currentLength = await dbPayments.collection.countDocuments({});
    if (currentLength >= minLength) {
        console.log("Payments already in DB. Skipping.");
        return;
    }

    await dbPayments.collection.deleteMany({});
    
    const users = await dbUsers.collection.find().toArray();

    for (const payment of standardData.payments) {
        findUser = users.find(user => user.mail === payment.user)
        
        await dbPayments.collection.insert(
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
    
    console.log("Dummy payments added to DB")
}

async function createRides() {

    console.log("Adding dummy rides to DB")

    let dbRides = await database.getDb("rides");
    let dbBikes = await database.getDb("bikes");
    let dbUsers = await database.getDb("users");
    
    const minLength = standardData.rides.length;
    const currentLength = await dbRides.collection.countDocuments({});
    if (currentLength >= minLength) {
        console.log("Rides already in DB. Skipping.");
        return;
    }

    await dbPayments.collection.deleteMany({});

    const users = await dbUsers.collection.find().toArray();
    const bike1 = await dbBikes.collection.findOne({number: 1});
    const bike2 = await dbBikes.collection.findOne({number: 2});
    
    const user = users[0]
    const startPos = bike1.position;
    const stopPos = bike2.position;
    const id = bike1._id;
    const start = new Date()
    const stop = new Date(Date.now() + 1000 * 60 * 5)

    for (const ride of standardData.rides) {
        
        await dbRides.collection.insert(
            {
                user: user,
                bike: id,
                start: start,
                stop: stop,
                startPos: startPos,
                stopPos: stopPos,
                duration: Math.ceil((stop - start) / (1000 * 60)),
                price: 100,
                parking: ride.parking,
                active: ride.active,
                createdAt: new Date()
            },
        );
    }

    dbRides.client.close()
    dbBikes.client.close()
    dbUsers.client.close()

    console.log("Dummy rides added to DB")
}

async function initDB() {
    try {
        console.log("Preparing DB")
        await createUsers();
        await createCities();
        await createZones();
        await createStations();
        await createBikes();
        await createPayments();
        await createRides();
        console.log("DB ready")
    } catch (e) {
        return new Error(e);
    }
};

module.exports = {initDB}
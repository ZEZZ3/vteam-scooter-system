"use strict";

const database = require('../database/database');
const bcrypt = require('bcryptjs');

module.exports = async function initDB() {
    console.log("Preparing DB")
    const { collection: collectionUsers, client } = await database.getDb("users");
    collectionUsers.deleteMany({})
    const users = [
        {
            mail: "admin@test.com",
            role: "admin",
            phone: "123456789",
            balance: 20000,
            verified: true,
        },
        {
            mail: "user@test.com",
            role: "customer",
            phone: "012345678",
            verified: true,
            balance: 200,
        },
        {
            mail: "user1@test.com",
            role: "customer",
            phone: "01234567832",
            verified: true,
            balance: 0,
        },
        {
            mail: "user2@test.com",
            role: "customer",
            phone: "0134567832",
            verified: true,
            balance: 200,
        }
    ];

    for (const user of users) {
        const password = await bcrypt.hash(process.env.TEST_PASSWORD, 10)
        await collectionUsers.updateOne(
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
    console.log("Users added to DB")

    const { collection: collectionBikes } = await database.getDb("bikes");

    const bikes = [
        {
            city: "",
            currentZone: "",
            currentStation: "",
            number: 1,
            battery: 100,
            status: "free",
            position: {}
        },
        {
            city: "",
            currentZone: "",
            currentStation: "",
            number: 2,
            battery: 100,
            status: "rented",
            position: {}
        },
        {
            city: "",
            currentZone: "",
            currentStation: "",
            number: 3,
            battery: 100,
            status: "free",
            position: {}
        }
    ];

    for (const bike of bikes) {
        await collectionBikes.updateOne(
            { number: bike.number },
            {
                $setOnInsert: { ...bike }
            },
            { upsert: true }
        );
    }

    console.log("Bikes added to DB")
    
    const { collection: collectionCities } = await database.getDb("cities");
    
    const cities = [
        {
            name: "",
            zones: [],
            stations: [],
        }
    ]

    for (const city of cities) {
        await collectionCities.updateOne(
            { name: city.name },
            {
                $setOnInsert: { ...city }
            },
            { upsert: true }
        );
    }

    console.log("Cities added to DB")

    const { collection: collectionZones } = await database.getDb("zones");
    await collectionZones.deleteMany({});

    const zones = [
        {
            name: "",
            zones: [],
            area: {},
        }
    ];

    for (const zone of zones) {
        await collectionZones.updateOne(
            { name: zone.name },
            {
                $setOnInsert: { ...zone }
            },
            { upsert: true }
        );
    }        

    console.log("Zones added to DB")

    const { collection: collectionStations } = await database.getDb("stations");
    await collectionStations.deleteMany({});

    const stations = [
        {
            name: "",
            zones: [],
            position: {},
        }
    ]

    for (const station of stations) {
        await collectionZones.updateOne(
            { name: station.name },
            {
                $setOnInsert: { ...station }
            },
            { upsert: true }
        );
    }    
    console.log("Stations added to DB")

    await client.close();

};
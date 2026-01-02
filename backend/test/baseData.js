"use strict";

const { ObjectId } = require('mongodb');
const database = require('../database/database');
const bcrypt = require('bcryptjs');

const baseData = {
    baseUserData: async function baseUserData() {
        const { collection, client } = await database.getDb("users");
        
        await collection.insertMany([
            {
                mail: "admin@test.com",
                password: await bcrypt.hash(process.env.TEST_PASSWORD, 10),
                role: "admin",
                phone: "123456789",
                verified: true,
                createdAt: new Date()
            },
            {
                mail: "user@test.com",
                password: await bcrypt.hash(process.env.TEST_PASSWORD, 10),
                role: "customer",
                phone: "012345678",
                verified: true,
                balance: 200,
                createdAt: new Date()
            },
            {
                mail: "user1@test.com",
                password: await bcrypt.hash(process.env.TEST_PASSWORD, 10),
                role: "customer",
                phone: "01234567832",
                verified: true,
                balance: 0,
                createdAt: new Date()
            },
            {
                mail: "user2@test.com",
                password: await bcrypt.hash(process.env.TEST_PASSWORD, 10),
                role: "customer",
                phone: "0134567832",
                verified: true,
                balance: 200,
                createdAt: new Date()
            }
        ]);
        await client.close();
    },

    baseRideData: async function baseRideData() {
        const { collection, client } = await database.getDb("rides");

        const dbUser = await database.getDb("users");
        const user1 = await dbUser.collection.findOne({mail: "user@test.com" });
        const user2 = await dbUser.collection.findOne({mail: "user2@test.com" });

        await collection.insertMany([
            {
                user: new ObjectId(user1._id),
                bike: "",
                start: Date.now(),
                stop: Date.now() + 1000*60*1,
                startPos: {},
                stopPos: {},
                duration: 0.0,
                price: 0.0,
                parking: "station",
                active: false,
            },
            {
                user: new ObjectId(user2._id),
                bike: "",
                start: Date.now(),
                stop: Date.now() + 1000*60*1,
                startPos: {},
                stopPos: {},
                duration: 0.0,
                price: 0.0,
                parking: "station",
                active: true,
            }
        ]);
        await client.close();
        await dbUser.client.close();
    },

    baseCityData: async function baseCityData() {
        const { collection, client } = await database.getDb("cities");
        
        await collection.insertMany([
            {
                name: "Stockholm",
                zones: [],
                stations: [],
            }, 
            {
                name: "Malmö",
                zones: [],
                stations: [],
            },
            {
                name: "Linköping",
                zones: [],
                stations: [],
            }
        ]);
        await client.close();
    },

    baseBikeData: async function baseBikeData() {
        const { collection, client } = await database.getDb("bikes");
        const dbCities = await database.getDb("cities");
        const city1 = await dbCities.collection.findOne({name: "Stockholm" });
        const city2 = await dbCities.collection.findOne({name: "Malmö" });
        const city3 = await dbCities.collection.findOne({name: "Linköping" });

        await collection.insertMany([
            {
                city: "Stockholm",
                cityID: city1._id,
                currentZone: "",
                currentStation: "",
                number: 1,
                battery: 100,
                status: "free",
                position: {},
                createdAt: new Date()
            },
            {
                city: "Linköping",
                cityID: city3._id,
                currentZone: "",
                currentStation: "",
                number: 2,
                battery: 100,
                status: "rented",
                position: {},
                createdAt: new Date()
            },
            {
                city: "Malmö",
                cityID: city2._id,
                currentZone: "",
                currentStation: "",
                number: 3,
                battery: 100,
                status: "free",
                position: {},
                createdAt: new Date()
            }
        ]);
        await client.close();
        await dbCities.client.close();
    },    

    baseZoneData: async function baseZoneData() {
        const { collection, client } = await database.getDb("zones");
        
        await collection.insertOne(
            {
                cityID: "",
                name: "",
                zones: [],
                area: {},
            }
        );
        await client.close();
    },

    baseStationsData: async function baseStationsData() {
        const { collection, client } = await database.getDb("stations");
        
        await collection.insertOne(
            {
                cityID: "",
                name: "",
                zones: [],
                position: {},
            }
        );
        await client.close();
    },

    basePaymentData: async function basePaymentData() {
        const { collection, client } = await database.getDb("payments");
        
        const dbUser = await database.getDb("users");
        const user1 = await dbUser.collection.findOne({mail: "user@test.com" });

        await collection.insertOne(
            {
                user: new ObjectId(user1._id),
                price: 0.0,
                type: "-",
                status: "-",
                createdAt: Date.now()
            },
        );
        await client.close();
        await dbUser.client.close();
    },

    baseSimulationData: async function baseSimulationData() {
        const { collection, client } = await database.getDb("simulations");
        
        await collection.insertOne(
            {
                numberOfBikes: 0,
                bikes: [],
                start: Date.now(),
                end: Date.now() + 1000*60*20,
                status: ""
            }
        );
        await client.close();        
    },
}


module.exports = baseData;
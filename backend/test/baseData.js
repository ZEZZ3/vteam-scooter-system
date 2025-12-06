"use strict";

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
                createdAt: new Date()
            }
        ]);
        await client.close();
    },

    baseRideData: async function baseRideData() {
        const { collection, client } = await database.getDb("rides");
        
        await collection.insertOne(
            {
                user: "",
                bike: "",
                start: Date.now(),
                stop: Date.now() + 1000*60*1,
                startPos: {},
                stopPos: {},
                duration: 0.0,
                price: 0.0,
                parking: "station",
                active: false,
            }
        );
        await client.close();
    },

    baseBikeData: async function baseBikeData() {
        const { collection, client } = await database.getDb("bikes");
        
        await collection.insertOne(
            {
                city: "",
                currentZone: "",
                currentStation: "",
                number: 1,
                battery: 100,
                status: "free",
                position: {}
            }
        );
        await client.close();
    },

    baseCityData: async function baseCityData() {
        const { collection, client } = await database.getDb("cities");
        
        await collection.insertOne(
            {
                name: "",
                zones: [],
                stations: [],
            }
        );
        await client.close();
    },

    baseZoneData: async function baseZoneData() {
        const { collection, client } = await database.getDb("zones");
        
        await collection.insertOne(
            {
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
                name: "",
                zones: [],
                position: {},
            }
        );
        await client.close();
    },

    basePaymentData: async function basePaymentData() {
        const { collection, client } = await database.getDb("payments");
        
        await collection.insertOne(
            {
                user: "",
                price: 0.0,
                type: "-",
                status: "-",
                createdAt: Date.now()
            }
        );
        await client.close();
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
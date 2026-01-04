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
        const dbCities = await database.getDb("cities");
        const city1 = await dbCities.collection.findOne({name: "Stockholm" });

        const zones = [
            {
                cityID: city1._id,
                name: "Östermalm",
                area: {
                    coordinates: [
                        {lat: 59.340628, long: 18.092183},
                        {lat: 59.338007, long: 18.103317},
                        {lat: 59.331617, long: 18.095166},
                        {lat: 59.333029, long: 18.075872},
                        {lat: 59.338106, long: 18.069670},
                        {lat: 59.345204, long: 18.073584},
                        {lat: 59.340628,long: 18.092183}
                    ]
                },
                createdAt: new Date()
            },
            {
                cityID: city1._id,
                name: "Djurgården",
                area: {
                    coordinates: [
                        {lat: 59.330929, long: 18.093944 },
                        {lat: 59.329090, long: 18.099696},
                        {lat: 59.329623, long: 18.105292},
                        {lat: 59.330130,long: 18.112934},
                        {lat: 59.330316, long: 18.127119},
                        {lat: 59.326273,long: 18.148348},
                        {lat: 59.323794,long: 18.148982},
                        {lat: 59.322732,long: 18.155186},
                        {lat: 59.321212,long: 18.153796},
                        {lat: 59.321479, long: 18.146551},
                        {lat: 59.322657,long: 18.145336},
                        {lat: 59.321722,long: 18.143067},
                        {lat: 59.322350, long: 18.140068},
                        {lat: 59.323080, long: 18.131375},
                        {lat: 59.321557,long: 18.123666},
                        {lat: 59.320246,long: 18.123153},
                        {lat: 59.319783,long: 18.112643},
                        {lat: 59.321038,long: 18.114047},
                        {lat: 59.321896,long: 18.113100},
                        {lat: 59.322802,long: 18.112694},
                        {lat: 59.322592,long: 18.109801},
                        {lat: 59.323467,long: 18.103330},
                        {lat: 59.325794,long: 18.096673},
                        {lat: 59.327267,long: 18.092009},
                        {lat: 59.328754,long: 18.089856},
                        {lat: 59.330339,long: 18.089316},
                        {lat: 59.329623,long: 18.105292},
                    ]
                },
                createdAt: new Date()
            }
        ];
    
        const insert = await collection.insertMany(zones);
        const zoneIDs = Object.values(insert.insertedIds);

        await dbCities.collection.findOneAndUpdate(
            { _id: city1._id },
            { $push: { zones: { $each: zoneIDs }}}
        );

        await client.close();
        await dbCities.client.close();
    },

    baseStationsData: async function baseStationsData() {
        const { collection, client } = await database.getDb("stations");
        
        const dbCities = await database.getDb("cities");
        const city1 = await dbCities.collection.findOne({name: "Stockholm" });
        const cityID = city1._id;
        
        const dbZones = await database.getDb("zones");
        const zone1 = await dbZones.collection.findOne({name: "Östermalm" });
        const zoneID1 = zone1._id
        const zone2 = await dbZones.collection.findOne({name: "Djurgården" });
        const zoneID2 = zone2._id

        await collection.insertMany([
            {
                cityID: cityID,
                name: "Karlaplan",
                zone: zoneID1,
                position: { lat: 59.337527, long: 18.090962 }
            },
            {
                cityID: cityID,
                name: "Humlegården",
                zone: zoneID1,
                position: { lat: 59.340783, long: 18.074177 }
            },
            {
                cityID: cityID,
                name: "Strandvägen",
                zone: zoneID1,
                position: { lat: 59.331876, long: 18.086445 }
            },
            {
                cityID: cityID,
                name: "Artillerigatan",
                zone: zoneID1,
                position: { lat: 59.333749, long: 18.080810 }
            },
            {
                cityID: cityID,
                name: "Djurgårdsbron",
                zone: zoneID2,
                position: { lat: 59.330593, long: 18.093916 }
            },
            {
                cityID: cityID,
                name: "Skansen",
                zone: zoneID2,
                position: { lat:  59.324092, long: 18.101789 }
            },
            {
                cityID: cityID,
                name: "Blockhusudden",
                zone: zoneID2,
                position: { lat:  59.322833, long: 18.146629 }
            },
            {
                cityID: cityID,
                name: "Djurgårdsbrunnsbron",
                zone: zoneID2,
                position: { lat:  59.329278, long: 18.131882 }
            },
            {
                cityID: cityID,
                name: "Folke Bernadottes bro",
                zone: zoneID2,
                position: { lat:  59.329850, long: 18.119150}
            },
            {
                cityID: cityID,
                name: "Kärleksudden",
                zone: zoneID2,
                position: { lat:  59.329471, long: 18.105414}
            },
        ]);

        await client.close();
        await dbCities.client.close();
        await dbZones.client.close();
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
process.env.NODE_ENV = 'test';

const request = require('supertest');
const server = require('./../app.js');
const database = require("../database/database")
const clearDatabase = require("./clearDatabase");
const baseData = require("./baseData");
const testHelpers = require("./testHelpers");
const ObjectId = require('mongodb').ObjectId;

let customerToken = "";
let adminToken = "";

beforeEach(async () => {
    await clearDatabase();
    await baseData.baseUserData();
    await baseData.baseCityData();
    await baseData.baseBikeData();
    await baseData.baseZoneData();
    await baseData.baseStationsData();

    const admin = await testHelpers.loginHelper("admin@test.com", process.env.TEST_PASSWORD, true)
    const customer = await testHelpers.loginHelper("user@test.com", process.env.TEST_PASSWORD, false)
    
    adminToken = admin.token;
    customerToken = customer.token;
});

describe('Zone', () => {

    describe('GET api/v1/zone', () => {
        test('200 SUCCESS: USER GET ALL ZONES', async () => {
            
            const response = await request(server)
                .get(`/api/v1/zone/`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(200);
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.length).toEqual(2);
        });

        test('200 SUCCESS: ADMIN GET ALL ZONES OF CITY', async () => {

            const response = await request(server)
                .get(`/api/v1/zone`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(200);
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.length).toEqual(2);
        });
    });

    describe('POST api/v1/zone', () => {
        test('201 CREATED: ADD ZONE TO CITY', async () => {
            let db = await database.getDb("cities");
            const city = await db.collection.findOne({name: "Malmö"});
            db.client.close();
            
            const data = {
                cityID: city._id,
                name: "Test",
                area: {
                    coordinates: [
                        {lat: 1.111111, long: 1.000000},
                        {lat: 1.111111, long: 1.000001},
                        {lat: 1.111112, long: 1.000002},
                        {lat: 1.111113, long: 1.000003},
                        {lat: 1.111111, long: 1.000000}
                    ]
                },
            }

            const response = await request(server)
                .post(`/api/v1/zone`)
                .set({ "x-access-token": `${adminToken}` })
                .send(data)
                .expect(201);
            
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.message).toEqual("Zone has been added.");
            
            let dbCheck = await database.getDb("cities");
            const cityCheck = await dbCheck.collection.findOne({name: "Malmö"});
            expect(cityCheck.zones.length).toEqual(1);
            dbCheck.client.close();

        });

        test('400 BAD REQUEST: ZONE ALREADY EXISTS', async () => {
            let db = await database.getDb("cities");
            const city = await db.collection.findOne({name: "Malmö"});
            db.client.close();
            
            const data = {
                cityID: city._id,
                name: "Test",
                area: {
                    coordinates: [
                        {lat: 1.111111, long: 1.000000},
                        {lat: 1.111111, long: 1.000001},
                        {lat: 1.111112, long: 1.000002},
                        {lat: 1.111113, long: 1.000003},
                        {lat: 1.111111, long: 1.000000}
                    ]
                },
            }

            const response = await request(server)
                .post(`/api/v1/zone`)
                .set({ "x-access-token": `${adminToken}` })
                .send(data)
                .expect(201);
            
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.message).toEqual("Zone has been added.");

            const response2 = await request(server)
                .post(`/api/v1/zone`)
                .set({ "x-access-token": `${adminToken}` })
                .send(data)
                .expect(400);

            expect(response2.body.error.title).toEqual("Bad request");
            expect(response2.body.error.message).toEqual("Zone with name 'Test' already exists in this city");

        });

        test('400 BAD REQUEST: INVALID CITY ID', async () => {
            const data = {
                cityID: "a",
                name: "Test",
                area: {
                    coordinates: [
                        {lat: 1.111111, long: 1.000000},
                        {lat: 1.111111, long: 1.000001},
                        {lat: 1.111112, long: 1.000002},
                        {lat: 1.111113, long: 1.000003},
                        {lat: 1.111111, long: 1.000000}
                    ]
                },
            }

            const response = await request(server)
                .post(`/api/v1/zone`)
                .set({ "x-access-token": `${adminToken}` })
                .send(data)
                .expect(400);
            
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual("Invalid ID: a");
        });

        test('400 BAD REQUEST: NO NAME FIELD', async () => {
            let db = await database.getDb("cities");
            const city = await db.collection.findOne({name: "Malmö"});
            db.client.close();
            
            const data = {
                cityID: city._id,
                area: {
                    coordinates: [
                        {lat: 1.111111, long: 1.000000},
                        {lat: 1.111111, long: 1.000001},
                        {lat: 1.111112, long: 1.000002},
                        {lat: 1.111113, long: 1.000003},
                        {lat: 1.111111, long: 1.000000}
                    ]
                },
            }

            const response = await request(server)
                .post(`/api/v1/zone`)
                .set({ "x-access-token": `${adminToken}` })
                .send(data)
                .expect(400);
            
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual("Name field is required.");
        });

        test('400 BAD REQUEST: NO AREA FIELD', async () => {
            let db = await database.getDb("cities");
            const city = await db.collection.findOne({name: "Malmö"});
            db.client.close();
            
            const data = {
                cityID: city._id,
                name: "Test",
            }

            const response = await request(server)
                .post(`/api/v1/zone`)
                .set({ "x-access-token": `${adminToken}` })
                .send(data)
                .expect(400);
            
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual("Area coordinate field is required.");
        });

        test('403 FORBIDDEN: USER ADD ZONE', async () => {
            let db = await database.getDb("cities");
            const city = await db.collection.findOne({name: "Malmö"});
            db.client.close();
            
            const data = {
                cityID: city._id,
                name: "Test",
                area: {
                    coordinates: [
                        {lat: 1.111111, long: 1.000000},
                        {lat: 1.111111, long: 1.000001},
                        {lat: 1.111112, long: 1.000002},
                        {lat: 1.111113, long: 1.000003},
                        {lat: 1.111111, long: 1.000000}
                    ]
                },
            }

            const response = await request(server)
                .post(`/api/v1/zone`)
                .set({ "x-access-token": `${customerToken}` })
                .send(data)
                .expect(403);
            
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Forbidden");
            expect(response.body.error.message).toEqual("Action not allowed.");
        });

        test('404 NOT FOUND: CITY ID', async () => {
            const notID = "aaaabbbbccccddddeeeeffff";

            const data = {
                cityID: notID,
                name: "Test",
                area: {
                    coordinates: [
                        {lat: 1.111111, long: 1.000000},
                        {lat: 1.111111, long: 1.000001},
                        {lat: 1.111112, long: 1.000002},
                        {lat: 1.111113, long: 1.000003},
                        {lat: 1.111111, long: 1.000000}
                    ]
                },
            }

            const response = await request(server)
                .post(`/api/v1/zone`)
                .set({ "x-access-token": `${adminToken}` })
                .send(data)
                .expect(404);
            
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Not found");
            expect(response.body.error.message).toEqual(`City with ID: ${notID} not found.`);
        });
    });

    describe('GET api/v1/zone/:zoneID', () => {
        test('200 OK: GET ZONE BY ID', async () => {
            let dbCity = await database.getDb("cities");
            const city = await dbCity.collection.findOne({name: "Stockholm"});
            dbCity.client.close();
            const zoneID = city.zones[0]
            
            const response = await request(server)
                .get(`/api/v1/zone/${zoneID}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(200);

            let dbZone = await database.getDb("zones");
            const zone = await dbZone.collection.findOne({_id: new ObjectId(zoneID)});
            dbZone.client.close();

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.zone.name).toEqual(zone.name);
            expect(response.body.data.zone.cityID).toEqual(zone.cityID.toString());
            expect(response.body.data.zone.area.coordinates.length).toEqual(zone.area.coordinates.length);
        });

        test('400 BAD REQUEST: INVALID ZONE ID', async () => {
            let dbCity = await database.getDb("cities");
            const city = await dbCity.collection.findOne({name: "Stockholm"});
            dbCity.client.close();
            
            const notID = "a";
            
            const response = await request(server)
                .get(`/api/v1/zone/${notID}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(400);
            
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual("Invalid zone ID: a");
        });

        test('404 NOT FOUND: ZONE NOT FOUND', async () => {
            const notID = "aaaabbbbccccddddeeeeffff";
            
            const response = await request(server)
                .get(`/api/v1/zone/${notID}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(404);
            
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Not found");
            expect(response.body.error.message).toEqual(`Zone with ID: ${notID} not found.`);
        });
    });

    describe('PATCH api/v1/zone/:zoneID', () => {
        test('200 UPDATED: ADMIN UPDATE ZONE AREA BY ID', async () => {
            let dbCity = await database.getDb("cities");
            const city = await dbCity.collection.findOne({name: "Stockholm"});
            dbCity.client.close();
            const zoneID = city.zones[0]
            
            const newData = {
                area: {
                    coordinates: [
                        {lat: 0, long: 0},
                        {lat: 59.338007, long: 18.103317},
                        {lat: 59.331617, long: 18.095166},
                        {lat: 59.333029, long: 18.075872},
                        {lat: 59.338106, long: 18.069670},
                        {lat: 59.345204, long: 18.073584},
                        {lat: 59.340628,long: 18.092183}
                    ]
                },
            }

            const response = await request(server)
                .patch(`/api/v1/zone/${zoneID}`)
                .set({ "x-access-token": `${adminToken}` })
                .send(newData)
                .expect(200);

            let dbZone = await database.getDb("zones");
            const zone = await dbZone.collection.findOne({_id: new ObjectId(zoneID)});
            dbZone.client.close();

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.name).toEqual(zone.name);
            expect(response.body.data.cityID).toEqual(zone.cityID.toString());
            expect(response.body.data.area.coordinates.length).toEqual(zone.area.coordinates.length);
            expect(response.body.data.area.coordinates[0].lat).toEqual(newData.area.coordinates[0].lat);
            expect(response.body.data.area.coordinates[0].long).toEqual(newData.area.coordinates[0].long);
        });

        test('200 UPDATED: ADMIN UPDATE ZONE NAME BY ID', async () => {
            let dbCity = await database.getDb("cities");
            const city = await dbCity.collection.findOne({name: "Stockholm"});
            dbCity.client.close();
            const zoneID = city.zones[0]
            
            const newData = {
                name: "Test"
            }

            const response = await request(server)
                .patch(`/api/v1/zone/${zoneID}`)
                .set({ "x-access-token": `${adminToken}` })
                .send(newData)
                .expect(200);

            let dbZone = await database.getDb("zones");
            const zone = await dbZone.collection.findOne({_id: new ObjectId(zoneID)});
            dbZone.client.close();

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.name).toEqual(newData.name);
            expect(response.body.data.cityID).toEqual(zone.cityID.toString());
            expect(response.body.data.area.coordinates.length).toEqual(zone.area.coordinates.length);
            expect(response.body.data.area.coordinates).toEqual(zone.area.coordinates);
            expect(response.body.data.area.coordinates).toEqual(zone.area.coordinates);
        });

        test('400 BAD REQUEST: NO DATA TO UPDATE', async () => {
            let dbCity = await database.getDb("cities");
            const city = await dbCity.collection.findOne({name: "Stockholm"});
            dbCity.client.close();
            const zoneID = city.zones[0]
            
            const newData = {}

            const response = await request(server)
                .patch(`/api/v1/zone/${zoneID}`)
                .set({ "x-access-token": `${adminToken}` })
                .send(newData)
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual("No data to update");
        });

        test('400 BAD REQUEST: INVALID ZONE ID', async () => {
            let dbCity = await database.getDb("cities");
            const city = await dbCity.collection.findOne({name: "Stockholm"});
            dbCity.client.close();

            const notID = "a";
            
            const newData = {
                area: {
                    coordinates: [
                        {lat: 0, long: 0},
                        {lat: 59.338007, long: 18.103317},
                        {lat: 59.331617, long: 18.095166},
                        {lat: 59.333029, long: 18.075872},
                        {lat: 59.338106, long: 18.069670},
                        {lat: 59.345204, long: 18.073584},
                        {lat: 59.340628,long: 18.092183}
                    ]
                },
            }

            const response = await request(server)
                .patch(`/api/v1/zone/${notID}`)
                .set({ "x-access-token": `${adminToken}` })
                .send(newData)
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual("Invalid zone ID: a");
        });

        test('403 FORBIDDEN: CUSTOMER UPDATE ZONE BY ID', async () => {
            let dbCity = await database.getDb("cities");
            const city = await dbCity.collection.findOne({name: "Stockholm"});
            dbCity.client.close();
            const zoneID = city.zones[0]
            
            const newData = {
                area: {
                    coordinates: [
                        {lat: 0, long: 0},
                        {lat: 59.338007, long: 18.103317},
                        {lat: 59.331617, long: 18.095166},
                        {lat: 59.333029, long: 18.075872},
                        {lat: 59.338106, long: 18.069670},
                        {lat: 59.345204, long: 18.073584},
                        {lat: 59.340628,long: 18.092183}
                    ]
                },
            }

            const response = await request(server)
                .patch(`/api/v1/zone/${zoneID}`)
                .set({ "x-access-token": `${customerToken}` })
                .send(newData)
                .expect(403);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Forbidden");
            expect(response.body.error.message).toEqual("Action not permitted.");
        });

        test('404 NOT FOUND: ZONE NOT FOUND', async () => {
            let dbCity = await database.getDb("cities");
            const city = await dbCity.collection.findOne({name: "Stockholm"});
            dbCity.client.close();

            const notID = "aaaabbbbccccddddeeeeffff";
            
            const newData = {
                area: {
                    coordinates: [
                        {lat: 0, long: 0},
                        {lat: 59.338007, long: 18.103317},
                        {lat: 59.331617, long: 18.095166},
                        {lat: 59.333029, long: 18.075872},
                        {lat: 59.338106, long: 18.069670},
                        {lat: 59.345204, long: 18.073584},
                        {lat: 59.340628,long: 18.092183}
                    ]
                },
            }

            const response = await request(server)
                .patch(`/api/v1/zone/${notID}`)
                .set({ "x-access-token": `${adminToken}` })
                .send(newData)
                .expect(404);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Not found");
            expect(response.body.error.message).toEqual(`Zone with ID: ${notID} not found.`);
        });
    });

    describe('DELETE api/v1/zone/:zoneID', () => {
        test('200 DELETED', async () => {
            let dbCity = await database.getDb("cities");
            const city = await dbCity.collection.findOne({name: "Stockholm"});
            dbCity.client.close();
            const zoneID = city.zones[0]

            const response = await request(server)
                .delete(`/api/v1/zone/${zoneID}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(200);

            let dbZone = await database.getDb("zones");
            const zone = await dbZone.collection.findOne({_id: new ObjectId(zoneID)});
            dbZone.client.close();

            let citiesCheck = await database.getDb("cities");
            const cityCheck = await citiesCheck.collection.findOne({_id: new ObjectId(city._id)});
            citiesCheck.client.close();

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.message).toEqual("Zone has been deleted");
            expect(zone).toEqual(null);
            expect(cityCheck.zones.length).toEqual(1);
        });

        test('400 BAD REQUEST: INVALID ID', async () => {
            notID = "a";

            const response = await request(server)
                .delete(`/api/v1/zone/${notID}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual(`Invalid ID: ${notID}`);
        });

        test('403 FORBIDDEN: USER DELETE ZONE', async () => {
            let dbCity = await database.getDb("cities");
            const city = await dbCity.collection.findOne({name: "Stockholm"});
            dbCity.client.close();
            const zoneID = city.zones[0]

            const response = await request(server)
                .delete(`/api/v1/zone/${zoneID}`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(403);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Forbidden");
            expect(response.body.error.message).toEqual("Action not permitted.");
        });

        test('404 NOT FOUND: ZONE NOT FOUND', async () => {
            const notID = "aaaabbbbccccddddeeeeffff";

            const response = await request(server)
                .delete(`/api/v1/zone/${notID}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(404);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Not found");
            expect(response.body.error.message).toEqual(`Zone with ID: '${notID}' not found.`);
        });
    });
});
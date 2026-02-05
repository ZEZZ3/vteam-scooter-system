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

describe('Station', () => {

    describe('GET api/v1/station', () => {
        test('200 SUCCESS: USER GET ALL STATIONS', async () => {
            
            const response = await request(server)
                .get(`/api/v1/station`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(200);
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.length).toEqual(10);
        });

        test('200 SUCCESS: ADMIN GET ALL STATIONS', async () => {

            const response = await request(server)
                .get(`/api/v1/station`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(200);
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.length).toEqual(10);
        });
    });

    describe('POST api/v1/station', () => {
        test('201 CREATED: ADD ZONE TO CITY', async () => {
            let db = await database.getDb("cities");
            const city = await db.collection.findOne({name: "Stockholm"});
            db.client.close();
            const zoneID = city.zones[0]
            
            const data = {
                cityID: city._id,
                name: "Test",
                zoneID: zoneID,
                position: {
                    lat: 1.111111, 
                    long: 1.000000
                },
            }

            const response = await request(server)
                .post(`/api/v1/station`)
                .set({ "x-access-token": `${adminToken}` })
                .send(data)
                .expect(201);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.message).toEqual("Station has been added.");
            
            let dbCity = await database.getDb("cities");
            let dbStation = await database.getDb("stations");

            const cityCheck = await dbCity.collection.findOne({name: "Stockholm"});
            const stationCheck = await dbStation.collection.findOne({name: "Test"});
            dbCity.client.close();
            dbStation.client.close();
            
            expect(cityCheck.stations.length).toEqual(11);
            expect(stationCheck.name).toEqual("Test");
            expect(stationCheck.zoneID).toEqual(zoneID.toString());
            expect(stationCheck.position.lat).toEqual(data.position.lat);
            expect(stationCheck.position.long).toEqual(data.position.long);
        });

        test('400 BAD REQUEST: STATION ALREADY EXISTS', async () => {
            let db = await database.getDb("cities");
            const city = await db.collection.findOne({name: "Stockholm"});
            db.client.close();
            const zoneID = city.zones[0]
            
            const data = {
                cityID: city._id,
                name: "Test",
                zoneID: zoneID,
                position: {
                    lat: 1.111111, 
                    long: 1.000000
                },
            }

            const response = await request(server)
                .post(`/api/v1/station`)
                .set({ "x-access-token": `${adminToken}` })
                .send(data)
                .expect(201);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.message).toEqual("Station has been added.");
            
            const response2 = await request(server)
                .post(`/api/v1/station`)
                .set({ "x-access-token": `${adminToken}` })
                .send(data)
                .expect(400);

            expect(response2.body.error.title).toEqual("Bad request");
            expect(response2.body.error.message).toEqual("Station with name 'Test' already exists in this city and zone");
        });

        test('400 BAD REQUEST: NO CITY ID', async () => {
            let db = await database.getDb("cities");
            const city = await db.collection.findOne({name: "Stockholm"});
            db.client.close();
            const zoneID = city.zones[0]
            
            const data = {
                name: "Test",
                zoneID: zoneID,
                position: {
                    lat: 1.111111, 
                    long: 1.000000
                },
            }

            const response = await request(server)
                .post(`/api/v1/station`)
                .set({ "x-access-token": `${adminToken}` })
                .send(data)
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual("City ID is required");
        });

        test('400 BAD REQUEST: NO ZONE ID', async () => {
            let db = await database.getDb("cities");
            const city = await db.collection.findOne({name: "Stockholm"});
            db.client.close();
            
            const data = {
                cityID: city._id,
                name: "Test",
                position: {
                    lat: 1.111111, 
                    long: 1.000000
                },
            }

            const response = await request(server)
                .post(`/api/v1/station`)
                .set({ "x-access-token": `${adminToken}` })
                .send(data)
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual("Zone ID is required");
        });

        test('400 BAD REQUEST: INVALID CITY ID', async () => {
            let db = await database.getDb("cities");
            const city = await db.collection.findOne({name: "Stockholm"});
            db.client.close();
            const zoneID = city.zones[0]
            const notID = "a";

            const data = {
                cityID: notID,
                name: "Test",
                zoneID: zoneID,
                position: {
                    lat: 1.111111, 
                    long: 1.000000
                },
            }

            const response = await request(server)
                .post(`/api/v1/station`)
                .set({ "x-access-token": `${adminToken}` })
                .send(data)
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual(`Invalid city ID: ${notID}`);
        });

        test('400 BAD REQUEST: INVALID ZONE ID', async () => {
            let db = await database.getDb("cities");
            const city = await db.collection.findOne({name: "Stockholm"});
            db.client.close();

            const notID = "a";
            const data = {
                cityID: city._id,
                name: "Test",
                zoneID: notID,
                position: {
                    lat: 1.111111, 
                    long: 1.000000
                },
            }

            const response = await request(server)
                .post(`/api/v1/station`)
                .set({ "x-access-token": `${adminToken}` })
                .send(data)
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual(`Invalid zone ID: ${notID}`);
        });

        test('400 BAD REQUEST: NO NAME', async () => {
            let db = await database.getDb("cities");
            const city = await db.collection.findOne({name: "Stockholm"});
            db.client.close();
            const zoneID = city.zones[0]
            
            const data = {
                cityID: city._id,
                zoneID: zoneID,
                position: {
                    lat: 1.111111, 
                    long: 1.000000
                },
            }

            const response = await request(server)
                .post(`/api/v1/station`)
                .set({ "x-access-token": `${adminToken}` })
                .send(data)
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual(`Name field is required.`);
        });

        test('400 BAD REQUEST: NO POSITION', async () => {
            let db = await database.getDb("cities");
            const city = await db.collection.findOne({name: "Stockholm"});
            db.client.close();
            const zoneID = city.zones[0]
            
            const data = {
                cityID: city._id,
                name: "Test",
                zoneID: zoneID,
            }

            const response = await request(server)
                .post(`/api/v1/station`)
                .set({ "x-access-token": `${adminToken}` })
                .send(data)
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual(`Position field is required.`);
        });

        test('403 FORBIDDEN: CUSTOMER ADD STATION', async () => {
            let db = await database.getDb("cities");
            const city = await db.collection.findOne({name: "Stockholm"});
            db.client.close();
            const zoneID = city.zones[0]
            
            const data = {
                cityID: city._id,
                name: "Test",
                zoneID: zoneID,
                position: {
                    lat: 1.111111, 
                    long: 1.000000
                },
            }

            const response = await request(server)
                .post(`/api/v1/station`)
                .set({ "x-access-token": `${customerToken}` })
                .send(data)
                .expect(403);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Forbidden");
            expect(response.body.error.message).toEqual("Action not allowed.");
        });

        test('404 NOT FOUND: CITY NOT FOUND', async () => {
            let db = await database.getDb("cities");
            const city = await db.collection.findOne({name: "Stockholm"});
            db.client.close();
            const zoneID = city.zones[0]
            const notID = "aaaabbbbccccddddeeeeffff";

            const data = {
                cityID: notID,
                zoneID: zoneID,
                name: "Test",
                position: {
                    lat: 1.111111, 
                    long: 1.000000
                },
            }

            const response = await request(server)
                .post(`/api/v1/station`)
                .set({ "x-access-token": `${adminToken}` })
                .send(data)
                .expect(404);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Not found");
            expect(response.body.error.message).toEqual(`City with ID: ${notID} not found.`);
        });

        test('404 NOT FOUND: ZONE NOT FOUND', async () => {
            let db = await database.getDb("cities");
            const city = await db.collection.findOne({name: "Stockholm"});
            db.client.close();
            const notID = "aaaabbbbccccddddeeeeffff";

            const data = {
                cityID: city._id,
                zoneID: notID,
                name: "Test",
                position: {
                    lat: 1.111111, 
                    long: 1.000000
                },
            }

            const response = await request(server)
                .post(`/api/v1/station`)
                .set({ "x-access-token": `${adminToken}` })
                .send(data)
                .expect(404);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Not found");
            expect(response.body.error.message).toEqual(`Zone with ID: ${notID} not found.`);
        });
    });

    describe('GET api/v1/station/:stationID', () => {
        test('200 OK: GET STATION BY ID', async () => {
            let dbCity = await database.getDb("cities");
            const city = await dbCity.collection.findOne({name: "Stockholm"});
            dbCity.client.close();
            const stationID = city.stations[0]
            
            const response = await request(server)
                .get(`/api/v1/station/${stationID}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(200);

            let dbStation = await database.getDb("stations");
            const station = await dbStation.collection.findOne({_id: new ObjectId(stationID)});
            dbStation.client.close();

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.station._id).toEqual(station._id.toString());
            expect(response.body.data.station.cityID).toEqual(station.cityID.toString());
            expect(response.body.data.station.name).toEqual(station.name);
            expect(response.body.data.station.zoneID).toEqual(station.zoneID.toString());
            expect(response.body.data.station.position).toEqual(station.position);
        });

        test('400 BAD REQUEST: INVALID STATION ID', async () => {
            const notID = "a"            

            const response = await request(server)
                .get(`/api/v1/station/${notID}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(400);


            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual(`Invalid station ID: ${notID}`);
        });

        test('404 NOT FOUND: STATION NOT FOUND', async () => {
            const notID = "aaaabbbbccccddddeeeeffff";        

            const response = await request(server)
                .get(`/api/v1/station/${notID}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(404);


            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Not found");
            expect(response.body.error.message).toEqual(`Station with ID: ${notID} not found.`);
        });
    });

    describe('PATCH api/v1/station/:stationID', () => {
        test('200 UPDATED: ADMIN UPDATE STATION NAME BY ID', async () => {
            let dbCity = await database.getDb("cities");
            const city = await dbCity.collection.findOne({name: "Stockholm"});
            dbCity.client.close();
            const stationID = city.stations[0]
            
            const newData = {
                name: "Test"
            }

            const response = await request(server)
                .patch(`/api/v1/station/${stationID}`)
                .set({ "x-access-token": `${adminToken}` })
                .send(newData)
                .expect(200);

            let dbStation = await database.getDb("stations");
            const station = await dbStation.collection.findOne({_id: new ObjectId(stationID)});
            dbStation.client.close();

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.name).toEqual(newData.name);
            expect(response.body.data.cityID).toEqual(station.cityID.toString());
            expect(response.body.data.zoneID).toEqual(station.zoneID.toString());
            expect(response.body.data.position).toEqual(station.position);
        });

        test('200 UPDATED: ADMIN UPDATE STATION POSITION BY ID', async () => {
            let dbCity = await database.getDb("cities");
            const city = await dbCity.collection.findOne({name: "Stockholm"});
            dbCity.client.close();
            const stationID = city.stations[0]
            
            const newData = {
                position: {lat: 0.000001, long: 0.000001}
            }

            const response = await request(server)
                .patch(`/api/v1/station/${stationID}`)
                .set({ "x-access-token": `${adminToken}` })
                .send(newData)
                .expect(200);

            let dbStation = await database.getDb("stations");
            const station = await dbStation.collection.findOne({_id: new ObjectId(stationID)});
            dbStation.client.close();

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.name).toEqual(station.name);
            expect(response.body.data.cityID).toEqual(station.cityID.toString());
            expect(response.body.data.zoneID).toEqual(station.zoneID.toString());
            expect(response.body.data.position).toEqual(newData.position);
        });

        test('200 UPDATED: ADMIN UPDATE ZONE ID BY ID', async () => {
            let dbCity = await database.getDb("cities");
            const city = await dbCity.collection.findOne({name: "Stockholm"});
            dbCity.client.close();
            const stationID = city.stations[0]
            
            const newData = {
                zoneID: city.zones[1]
            }

            const response = await request(server)
                .patch(`/api/v1/station/${stationID}`)
                .set({ "x-access-token": `${adminToken}` })
                .send(newData)
                .expect(200);

            let dbStation = await database.getDb("stations");
            const station = await dbStation.collection.findOne({_id: new ObjectId(stationID)});
            dbStation.client.close();

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.name).toEqual(station.name);
            expect(response.body.data.cityID).toEqual(station.cityID.toString());
            expect(response.body.data.zoneID).toEqual(newData.zoneID.toString());
            expect(response.body.data.position).toEqual(station.position);
        });      
        
        test('400 BAD REQUEST: NO DATA TO UPDATE', async () => {
            let dbCity = await database.getDb("cities");
            const city = await dbCity.collection.findOne({name: "Stockholm"});
            dbCity.client.close();
            const stationID = city.stations[0]
            
            const newData = {
            }

            const response = await request(server)
                .patch(`/api/v1/station/${stationID}`)
                .set({ "x-access-token": `${adminToken}` })
                .send(newData)
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual("No data to update");
        });

        test('403 FORBIDDEN: CUSTOMER UPDATE STATION', async () => {
            let dbCity = await database.getDb("cities");
            const city = await dbCity.collection.findOne({name: "Stockholm"});
            dbCity.client.close();
            const stationID = city.stations[0]
            
            const newData = {
                name: "Test"
            }

            const response = await request(server)
                .patch(`/api/v1/station/${stationID}`)
                .set({ "x-access-token": `${customerToken}` })
                .send(newData)
                .expect(403);


            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Forbidden");
            expect(response.body.error.message).toEqual("Action not permitted.");
        });

        test('404 NOT FOUND: STATION NOT FOUND', async () => {
            const notID = "aaaabbbbccccddddeeeeffff";  
            const newData = {
                name: "Test"
            }

            const response = await request(server)
                .patch(`/api/v1/station/${notID}`)
                .set({ "x-access-token": `${adminToken}` })
                .send(newData)
                .expect(404);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Not found");
            expect(response.body.error.message).toEqual(`Station with ID: ${notID} not found.`);
        });
    });

    describe('DELETE api/v1/station/:stationID', () => {
        test('200 DELETED: DELETE STATION', async () => {
            let dbCity = await database.getDb("cities");
            const city = await dbCity.collection.findOne({name: "Stockholm"});
            dbCity.client.close();
            const stationID = city.stations[0]

            const response = await request(server)
                .delete(`/api/v1/station/${stationID}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(200);

            let dbStation = await database.getDb("stations");
            const station = await dbStation.collection.findOne({_id: new ObjectId(stationID)});
            dbStation.client.close();

            let citiesCheck = await database.getDb("cities");
            const cityCheck = await citiesCheck.collection.findOne({_id: new ObjectId(city._id)});
            citiesCheck.client.close();

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.message).toEqual("Station has been deleted");
            expect(station).toEqual(null);
            expect(cityCheck.stations.length).toEqual(10);
        });

        test('400 BAD REQUEST: INVALID STATION ID', async () => {

            const notID = "a"

            const response = await request(server)
                .delete(`/api/v1/station/${notID}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual(`Invalid ID: ${notID}`);
        });

        test('403 FORBIDDEN: CUSTOMER DELETE STATION', async () => {
            let dbCity = await database.getDb("cities");
            const city = await dbCity.collection.findOne({name: "Stockholm"});
            dbCity.client.close();
            const stationID = city.stations[0]

            const response = await request(server)
                .delete(`/api/v1/station/${stationID}`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(403);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Forbidden");
            expect(response.body.error.message).toEqual("Action not permitted.");
        });

        test('404 NOT FOUND: STATION NOT FOUND', async () => {

            const notID = "aaaabbbbccccddddeeeeffff";  

            const response = await request(server)
                .delete(`/api/v1/station/${notID}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(404);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Not found");
            expect(response.body.error.message).toEqual(`Station with ID: '${notID}' not found.`);
        });
    });
});
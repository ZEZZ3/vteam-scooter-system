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

describe('City', () => {
    describe('GET api/v1/city/', () => {
        test('200 SUCCESS: USER GET ALL CITIES', async () => {
            const response = await request(server)
                .get(`/api/v1/city`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(200);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.length).toEqual(3); 
        });

        test('200 SUCCESS: ADMIN GET ALL CITIES', async () => {
            const response = await request(server)
                .get(`/api/v1/city`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(200);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.length).toEqual(3); 
        });
    });

    describe('POST api/v1/city/', () => {
        test('201 CREATED: ADMIN ADD CITY', async () => {
            const data = {
                name: "Göteborg"
            }
            const response = await request(server)
                .post(`/api/v1/city`)
                .set({ "x-access-token": `${adminToken}` })
                .send(data)
                .expect(201);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.message).toEqual("City has been added.");
        });


        test('403 FORBIDDEN: USER ADD CITY', async () => {
            const data = {
                name: "Göteborg"
            }
            const response = await request(server)
                .post(`/api/v1/city`)
                .set({ "x-access-token": `${customerToken}` })
                .send(data)
                .expect(403);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Forbidden");
            expect(response.body.error.message).toEqual("Action not allowed.");

        });

        test('400 BAD REQUEST: NO NAME', async () => {
            const data = {}
            const response = await request(server)
                .post(`/api/v1/city`)
                .set({ "x-access-token": `${adminToken}` })
                .send(data)
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual("Name field is required.");
        });

        test('400 BAD REQUEST: CITY EXISTS', async () => {
            const data = {name: "Stockholm"}
            const response = await request(server)
                .post(`/api/v1/city`)
                .set({ "x-access-token": `${adminToken}` })
                .send(data)
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual("City with name 'Stockholm' already exists");
        });
    });

    describe('GET api/v1/city/:cityID', () => {
        test('200 OK: USER GET CITY', async () => {
            let db = await database.getDb("cities");
            const city = await db.collection.findOne({name: "Stockholm"});
            db.client.close();

            const response = await request(server)
                .get(`/api/v1/city/${city._id}`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(200);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.city.name).toEqual("Stockholm");
            expect(response.body.data.city._id).toEqual(city._id.toString());
        });

        test('200 OK: ADMIN GET CITY', async () => {
            let db = await database.getDb("cities");
            const city = await db.collection.findOne({name: "Stockholm"});
            db.client.close();

            const response = await request(server)
                .get(`/api/v1/city/${city._id}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(200);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.city.name).toEqual("Stockholm");
            expect(response.body.data.city._id).toEqual(city._id.toString());
        });

        test('400 BAD REQUEST: INVALID ID', async () => {
           const notID = "a";

            const response = await request(server)
                .get(`/api/v1/city/${notID}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual("Invalid ID: a");
        });

        test('404 NOT FOUND', async () => {
            const notID = "aaaabbbbccccddddeeeeffff";

            const response = await request(server)
                .get(`/api/v1/city/${notID}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(404);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Not found");
            expect(response.body.error.message).toEqual(`City with id '${notID}' not found`);
        });
    });

    describe('DELETE api/v1/city/:cityID', () => {
        test('200 OK: ADMIN DELETE CITY', async () => {
            let db = await database.getDb("cities");
            const city = await db.collection.findOne({name: "Linköping"});
            db.client.close();

            const response = await request(server)
                .delete(`/api/v1/city/${city._id}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(200);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.message).toEqual("City has been deleted");
        });

        test('400 BAD REQUEST: INVALID ID', async () => {
           const notID = "a";

            const response = await request(server)
                .delete(`/api/v1/city/${notID}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual("Invalid ID: a");
        });

        test('403 FORBIDDEN: CUSTOMER DELETE CITY', async () => {
            let db = await database.getDb("cities");
            const city = await db.collection.findOne({name: "Linköping"});
            db.client.close();

            const response = await request(server)
                .delete(`/api/v1/city/${city._id}`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(403);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Forbidden");
            expect(response.body.error.message).toEqual("Action not permitted.");
        });

        test('404 NOT FOUND', async () => {
            const notID = "aaaabbbbccccddddeeeeffff";

            const response = await request(server)
                .delete(`/api/v1/city/${notID}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(404);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Not found");
            expect(response.body.error.message).toEqual(`City with ID: '${notID}' not found.`);
        });
    });
});
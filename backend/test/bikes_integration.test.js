process.env.NODE_ENV = 'test';

const request = require('supertest');
const server = require('./../app.js');
const database = require("../database/database")
const clearDatabase = require("./clearDatabase");
const baseData = require("./baseData");
const testHelpers = require("./testHelpers");

let customerToken = "";
let adminToken = "";

beforeEach(async () => {
    await clearDatabase();
    await baseData.baseUserData();
    await baseData.baseBikeData();
    await baseData.baseRideData();

    const admin = await testHelpers.loginHelper("admin@test.com", process.env.TEST_PASSWORD, true)
    const customer = await testHelpers.loginHelper("user@test.com", process.env.TEST_PASSWORD, false)
    
    adminToken = admin.token;
    customerToken = customer.token;
});

describe('Bikes', () => {
    describe('GET api/v1/bikes/', () => {
        // api/v1/bikes/
        test('200 SUCCESS: USER GET ALL BIKES', async () => {
            const response = await request(server)
                .get(`/api/v1/bikes`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(200);

            // there are 3 bikes in the database but 1 is rented, 
            // so the user should only recieve 2 bikes which are free given no queries
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.length).toEqual(2); 
        });

        // api/v1/bikes?rented=true
        test('200 SUCCESS: USER GET RENTED BIKES WITH QUERY', async () => {
            const response = await request(server)
                .get(`/api/v1/bikes?rented=true`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(200);
            
            // should give the same result as if no query is made (only free bikes)
            // ?rented is reserved for admins
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.length).toEqual(2);
        });

        // api/v1/bikes?free=true
        test('200 SUCCESS: USER GET FREE BIKES WITH QUERY', async () => {
            const response = await request(server)
                .get(`/api/v1/bikes?free=true`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(200);
            
            // should give the same result as if no query is made (only free bikes)
            // ?free is reserved for admins
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.length).toEqual(2);
        });

        // api/v1/bikes?free=true&rented=true
        test('200 SUCCESS: USER GET RENTED & FREE BIKES', async () => {
            const response = await request(server)
                .get(`/api/v1/bikes?free=true&rented=true`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(200);
            
            // should give the same result as if no query is made (only free bikes)
            // ?free&rented are reserved for admins
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.length).toEqual(2);
        });

        // api/v1/bikes?city=Malmö
        test('200 SUCCESS: USER GET FREE BIKES IN CITY', async () => {
            const response = await request(server)
                .get(`/api/v1/bikes?city=Malmö`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(200);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.length).toEqual(1);
            expect(response.body.data[0].city).toEqual("Malmö");
        });

        // api/v1/bikes
        test('200 SUCCESS: ADMIN GET ALL', async () => {
            const response = await request(server)
                .get(`/api/v1/bikes`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(200);
            
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.length).toEqual(3);
        });

        // api/v1/bikes?rented=true
        test('200 SUCCESS: ADMIN GET RENTED', async () => {
            const response = await request(server)
                .get(`/api/v1/bikes?rented=true`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(200);
            
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.length).toEqual(1);
        });

        // api/v1/bikes?free=true
        test('200 SUCCESS: ADMIN GET FREE', async () => {
            const response = await request(server)
                .get(`/api/v1/bikes?free=true`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(200);
            
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.length).toEqual(2);
        });

        // api/v1/bikes?free=true&rented=true
        test('200 SUCCESS: ADMIN GET FREE & RENTED', async () => {
            const response = await request(server)
                .get(`/api/v1/bikes?free=true&rented=true`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(200);
            
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.length).toEqual(3);
        });

        // api/v1/bikes?city=STOCKHOLM
        test('200 SUCCESS: ADMIN GET FREE & RENTED', async () => {
            const response = await request(server)
                .get(`/api/v1/bikes?city=STOCKHOLM`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(200);
            
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.length).toEqual(1);
            expect(response.body.data[0].city).toEqual("Stockholm");
        });
    });

    describe('POST api/v1/bikes/', () => {
        test('403 FORBIDDEN: USER ADD BIKE', async () => {
            const newData = {
                city: "Luleå",
                currentZone: {},
                currentStation: {},
                position: {}
            }

            const response = await request(server)
                .post(`/api/v1/bikes`)
                .set({ "x-access-token": `${customerToken}` })
                .send(newData)
                .expect(403);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Forbidden");
            expect(response.body.error.message).toEqual("Action not allowed.");
        });

        test('400 BAD REQUEST: MISSING FIELD', async () => {
            const newData = {
                currentZone: {},
                currentStation: {},
                position: {}
            }

            const response = await request(server)
                .post(`/api/v1/bikes`)
                .set({ "x-access-token": `${adminToken}` })
                .send(newData)
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual("Data field missing.");
        });

        test('201 CREATED: ADD BIKE', async () => {
            const newData = {
                city: "Luleå",
                currentZone: {},
                currentStation: {},
                position: {}
            }

            let response = await request(server)
                .post(`/api/v1/bikes`)
                .set({ "x-access-token": `${adminToken}` })
                .send(newData)
                .expect(201);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.message).toEqual("Bike has been added.");

            const db = await database.getDb("bikes")
            const bike = await db.collection.findOne(
                { number: 4 }
            );
            db.client.close();
            expect(bike).toEqual(expect.any(Object));
            expect(bike.city).toEqual("Luleå");
        });
    });

    describe('GET api/v1/bikes/:bikeID', () => {
        test('400 BAD REQUEST: INVALID ID', async () => {
            
            const notID = "a";

            const response = await request(server)
                .get(`/api/v1/bikes/${notID}`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual(`Invalid ID: ${notID}`);
        });

        test('404 NOT FOUND: INVALID ID', async () => {
            
            const notID = "aaaabbbbccccddddeeeeffff";

            const response = await request(server)
                .get(`/api/v1/bikes/${notID}`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(404);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Not found");
            expect(response.body.error.message).toEqual(`Could not find bike with ID: ${notID}`);
        });

        test('404 NOT FOUND: CUSTOMER GET RENTED BIKE', async () => {
            const bike = await testHelpers.getBike(2);

            const response = await request(server)
                .get(`/api/v1/bikes/${bike._id}`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(404);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Not found");
            expect(response.body.error.message).toEqual(`Could not find bike with ID: ${bike._id.toString()}`);
        });

        test('200 OK: CUSTOMER GET FREE BIKE', async () => {
            const bike = await testHelpers.getBike(1);

            const response = await request(server)
                .get(`/api/v1/bikes/${bike._id}`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(200);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data._id).toEqual(bike._id.toString());
        });

        test('200 OK: ADMIN GET RENTED BIKE', async () => {
            const bike = await testHelpers.getBike(2);

            const response = await request(server)
                .get(`/api/v1/bikes/${bike._id}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(200);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data._id).toEqual(bike._id.toString());
        });
   

    });

    describe('PATCH api/v1/bikes/:bikeID', () => {

        test('200 OK: UPDATED', async () => {
            let bike = await testHelpers.getBike(1);
            
            const newData = {
                city: "elsewhere"
            }

            const response = await request(server)
                .patch(`/api/v1/bikes/${bike._id}`)
                .set({ "x-access-token": `${adminToken}` })
                .send(newData)
                .expect(200);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.city).toEqual("elsewhere");
        });

        test('400 BAD REQUEST: INVALID ID', async () => {
            
            const notID = "a";

            const response = await request(server)
                .patch(`/api/v1/bikes/${notID}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual(`Invalid ID: ${notID}`);
        });
        
        test('400 BAD REQUEST: NO DATA TO UPDATE', async () => {
            
            const bike = await testHelpers.getBike(1);

            const response = await request(server)
                .patch(`/api/v1/bikes/${bike._id}`)
                .set({ "x-access-token": `${adminToken}` })
                .send({})
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual("No data to update");
        });

        test('403 FORBIDDEN: CUSTOMER UPDATE BIKE', async () => {
            
            const bike = await testHelpers.getBike(1);

            const response = await request(server)
                .patch(`/api/v1/bikes/${bike._id}`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(403);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Forbidden");
            expect(response.body.error.message).toEqual("Action not permitted.");
        });

        test('404 NOT FOUND: ID NOT FOUND', async () => {
            const newData = {
                city: "elsewhere"
            }
            const notID = "aaaabbbbccccddddeeeeffff";

            const response = await request(server)
                .patch(`/api/v1/bikes/${notID}`)
                .set({ "x-access-token": `${adminToken}` })
                .send(newData)
                .expect(404);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Not found");
            expect(response.body.error.message).toEqual(`Bike with ID: ${notID} not found.`);
        });
    });

    describe('DELETE api/v1/bikes/:bikeID', () => {

        test('200 OK: DELETED', async () => {
            let bike = await testHelpers.getBike(1);

            const response = await request(server)
                .delete(`/api/v1/bikes/${bike._id}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(200);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.message).toEqual("Bike has been deleted");
        });

        test('400 BAD REQUEST: INVALID ID', async () => {
            
            const notID = "a";

            const response = await request(server)
                .delete(`/api/v1/bikes/${notID}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual(`Invalid ID: ${notID}`);
        });

        test('403 FORBIDDEN: NOT ADMIN', async () => {
            const bike = await testHelpers.getBike(1);

            const response = await request(server)
                .delete(`/api/v1/bikes/${bike._id}`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(403);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Forbidden");
            expect(response.body.error.message).toEqual(`Action not permitted.`);
        });

        test('404 NOT FOUND: INVALID ID', async () => {
            const notID = "aaaabbbbccccddddeeeeffff";
            
            const response = await request(server)
                .delete(`/api/v1/bikes/${notID}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(404);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Not found");
            expect(response.body.error.message).toEqual(`Bike with ID: '${notID}' not found.`);
        });
    });

});
process.env.NODE_ENV = 'test';

const ObjectId = require('mongodb').ObjectId;
const request = require('supertest');
const server = require('./../app.js');

const database = require("../database/database")
const clearDatabase = require("./clearDatabase");
const baseData = require("./baseData");
const testHelpers = require("./testHelpers.js")

let customerID = "";
let customerToken = "";
let adminToken = "";
let bike = {};


beforeEach(async () => {
    await clearDatabase();
    await baseData.baseUserData();
    await baseData.baseCityData();
    await baseData.baseBikeData();
    await baseData.baseRideData();

    const admin = await testHelpers.loginHelper("admin@test.com", process.env.TEST_PASSWORD, true)
    const customer = await testHelpers.loginHelper("user@test.com", process.env.TEST_PASSWORD, false)
    
    adminToken = admin.token;
    customerToken = customer.token;
    customerID = customer.id;

    bike = await testHelpers.getBike();
});

describe('Rent', () => {
    describe('GET api/v1/rent/:bikeid', () => {

        test('404 NOT FOUND: BIKE NOT FOUND', async () => {
            const notID = "aaaabbbbccccddddeeeeffff";

            const response = await request(server)
                .get(`/api/v1/rent/${notID}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(404);
            
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Not found");
            expect(response.body.error.message).toEqual(`Bike with ID: ${notID} could not be found`);
        });

        test('200 OK: GET BIKE STATUS', async () => {

            const response = await request(server)
                .get(`/api/v1/rent/${bike._id}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(200);
            
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.status).toEqual("free");
        }); 
    });

    describe('POST api/v1/rent/start/:bikeid', () => {

        test('201 CREATED: BIKE IS RENTED', async () => {
            bike = await testHelpers.getBike(1);

            const response = await request(server)
                .post(`/api/v1/rent/start/${bike._id}`)
                .set({ "x-access-token": `${customerToken}` })
                .send()
                .expect(201);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.message).toEqual("Ride has started");
            expect(response.body.data.bikeID).toEqual(bike._id.toString());
            expect(response.body.data.userID).toEqual(customerID);

            const db = await database.getDb("rides")
            const ride = await db.collection.findOne(
                { user: new ObjectId(customerID),
                  bike: new ObjectId(bike._id.toString())
                }
            );
            db.client.close();

            expect(ride.active).toEqual(true);
            expect(response.body.data.rideID).toEqual(ride._id.toString());
        });

        test('402 INSUFFICIENT BALANCE: USER HAS TOO LOW BALANCE', async () => {
            bike = await testHelpers.getBike(1);
            const customer = await testHelpers.loginHelper("user1@test.com", process.env.TEST_PASSWORD, false)

            const response = await request(server)
                .post(`/api/v1/rent/start/${bike._id}`)
                .set({ "x-access-token": `${customer.token}` })
                .send()
                .expect(402);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Insufficient balance");
            expect(response.body.error.message).toEqual("Users balance is too low to start a ride.");
        });

        test('404 NOT FOUND: BIKE NOT FOUND', async () => {
            const notID = "aaaabbbbccccddddeeeeffff";

            const response = await request(server)
                .post(`/api/v1/rent/start/${notID}`)
                .set({ "x-access-token": `${adminToken}` })
                .send()
                .expect(404);
            
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Not found");
            expect(response.body.error.message).toEqual(`Bike with ID: ${notID} could not be found`);
        });

        test('409 CONFLICT: BIKE IS BUSY', async () => {
            bike = await testHelpers.getBike(2);

            const response = await request(server)
                .post(`/api/v1/rent/start/${bike._id}`)
                .set({ "x-access-token": `${adminToken}` })
                .send()
                .expect(409);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Conflict");
            expect(response.body.error.message).toEqual(`Bike with ID: ${bike._id} is busy and cant be rented.`);
        });

        test('409 CONFLICT: BIKE IS ACTIVE', async () => {
            bike = await testHelpers.getBike();

            const db = await database.getDb("rides")
            const ride = await db.collection.findOneAndUpdate(
                { active: true },
                { $set: { bike: new ObjectId(bike._id) } },
                { returnDocument: "after" }
            );
            await db.client.close();

            const response = await request(server)
                .post(`/api/v1/rent/start/${bike._id}`)
                .set({ "x-access-token": `${adminToken}` })
                .send()
                .expect(409);
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Conflict");
            expect(response.body.error.message).toEqual(`Bike with ID: ${bike._id} is already in a ride and cant be rented.`);
        });
    });

    describe('POST api/v1/rent/stop/:bikeid', () => {

        test('400 BAD REQUEST: NO PARKINGTYPE', async () => {
            const rent = await request(server)
                .post(`/api/v1/rent/start/${bike._id}`)
                .set({ "x-access-token": `${customerToken}` })
                .send()
                .expect(201);
            
            const response = await request(server)
                .post(`/api/v1/rent/stop/${bike._id}`)
                .set({ "x-access-token": `${adminToken}` })
                .send()
                .expect(400);
            
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad Request");
            expect(response.body.error.message).toEqual("Parking type is missing");
        });

        test('404 NOT FOUND: BIKE NOT FOUND', async () => {
            const notID = "aaaabbbbccccddddeeeeffff";

            const response = await request(server)
                .post(`/api/v1/rent/stop/${notID}`)
                .set({ "x-access-token": `${adminToken}` })
                .send({parkingType: "free"})
                .expect(404);
            
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Not found");
            expect(response.body.error.message).toEqual(`Bike with ID: ${notID} could not be found`);
        });

        test('404 NOT FOUND: RIDE NOT FOUND', async () => {

            const response = await request(server)
                .post(`/api/v1/rent/stop/${bike._id}`)
                .set({ "x-access-token": `${adminToken}` })
                .send({parkingType: "free"})
                .expect(404);
            
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Not found");
            expect(response.body.error.message).toEqual(`Could not find ride for bike with id: ${bike._id}`);
        });

        test('403 FORBIDDEN: CUSTOMER STOP OTHER RIDE', async () => {
            // rent bike 1
            const bike1UserToken = customerToken;
            const bike1ID = bike._id;

            const rent = await request(server)
                .post(`/api/v1/rent/start/${bike1ID}`)
                .set({ "x-access-token": `${bike1UserToken}` })
                .send()
                .expect(201);
            
            // rent bike 2
            const customer = await testHelpers.loginHelper("user2@test.com", process.env.TEST_PASSWORD, false)
            const bike2UserToken = customer.token
            bike2 = await testHelpers.getBike(3);
            bike2ID = bike2._id;
            
            const rent2 = await request(server)
                .post(`/api/v1/rent/start/${bike2ID}`)
                .set({ "x-access-token": `${bike2UserToken}` })
                .send({parkingType: "free"})
                .expect(201);

            const response = await request(server)
                .post(`/api/v1/rent/stop/${bike2ID}`)
                .set({ "x-access-token": `${bike1UserToken}` })
                .send({parkingType: "free"})
                .expect(403);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Forbidden");
            expect(response.body.error.message).toEqual("You are not allowed to stop this ride");
        });
        test('200 OK: RIDE ENDED', async () => {

            let response = await request(server)
                .post(`/api/v1/rent/start/${bike._id}`)
                .set({ "x-access-token": `${customerToken}` })
                .send()
                .expect(201);

            response = await request(server)
                .post(`/api/v1/rent/stop/${bike._id}`)
                .set({ "x-access-token": `${customerToken}` })
                .send({parkingType: "free"})
                .expect(200);

            let dbRides = await database.getDb("rides")
            const ride = await dbRides.collection.findOne(
                { bike: bike._id }
            );

            dbPayments = await database.getDb("payments")
            const payment = await dbPayments.collection.findOne(
                { ride: ride._id }
            );

            await dbRides.client.close();
            await dbPayments.client.close();

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.message).toEqual("Ride has ended");
            expect(response.body.data.bikeID).toEqual(bike._id.toString());
            expect(response.body.data.userID).toEqual(customerID);
            expect(response.body.data.rideID).toEqual(ride._id.toString());
            expect(response.body.data.duration).toEqual(1);
            expect(response.body.data.price).toBeDefined();
            expect(response.body.data.balance).toBeLessThan(200);

            expect(payment.user.toString()).toEqual(customerID);
            expect(payment.ride.toString()).toEqual(ride._id.toString());
            expect(payment.price).toBeGreaterThan(0);
            expect(payment.type).toEqual("ride");
            expect(payment.status).toEqual("finished");
        });     
    });
});
process.env.NODE_ENV = 'test';

const ObjectId = require('mongodb').ObjectId;
const request = require('supertest');
const server = require('./../app.js');
const jwt = require("jsonwebtoken");
const database = require("../database/database")

let customerID = "";
let customerToken = "";
let adminID = "";
let adminToken = "";
let bike = {};

const clearDatabase = require("./clearDatabase");
const baseData = require("./baseData");

async function loginHelper(mail, password, admin) {
    const response = await request(server)
        .post('/api/v1/users/login')
        .send({ mail: mail, password: password});

    if (response.body) {
        if (admin) {
            adminToken = response.body.data.token;
            const decode = jwt.verify(adminToken, process.env.JWT_SECRET);
            adminID = decode.id;
        } else {
            customerToken = response.body.data.token;
            const decode = jwt.verify(customerToken, process.env.JWT_SECRET);
            customerID = decode.id;
        }
    }
    return response;
}

async function getBike(num = 1) {
    const db = await database.getDb("bikes")
    const bike = await db.collection.findOne({ number: num});
    await db.client.close();
    return bike; 
}

beforeEach(async () => {
    await clearDatabase();
    await baseData.baseUserData();
    await baseData.baseBikeData();
    await baseData.baseRideData();

    const _ = await loginHelper("admin@test.com", process.env.TEST_PASSWORD, true)
    const __ = await loginHelper("user@test.com", process.env.TEST_PASSWORD, false)
    bike = await getBike();
});

//getRentStatus
// get api/v1/rent/:id

// startRide
// post api/v1/rent/start/:id

// stopRide
// post api/v1/rent/stop/:id
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
            console.log(bike)
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
            bike = await getBike(1);

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
            bike = await getBike(1);
            const _ = await loginHelper("user1@test.com", process.env.TEST_PASSWORD, false)

            const response = await request(server)
                .post(`/api/v1/rent/start/${bike._id}`)
                .set({ "x-access-token": `${customerToken}` })
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
            bike = await getBike(2);

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
            bike = await getBike(1);

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
});
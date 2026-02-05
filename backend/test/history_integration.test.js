process.env.NODE_ENV = 'test';

const request = require('supertest');
const server = require('./../app.js');
const database = require("../database/database")
const clearDatabase = require("./clearDatabase");
const baseData = require("./baseData");
const testHelpers = require("./testHelpers");
const { ObjectId } = require('mongodb');

let customerToken = "";
let customerID = "";
let adminToken = "";
let adminID = "";

beforeEach(async () => {
    await clearDatabase();
    await baseData.baseUserData();
    await baseData.baseCityData();
    await baseData.baseBikeData();
    await baseData.baseRideData();
    await baseData.basePaymentData();

    const admin = await testHelpers.loginHelper("admin@test.com", process.env.TEST_PASSWORD, true)
    const customer = await testHelpers.loginHelper("user@test.com", process.env.TEST_PASSWORD, false)
    
    adminToken = admin.token;
    adminID = admin.id;
    customerToken = customer.token;
    customerID = customer.id;
});

describe('History', () => {
    describe('GET api/v1/history', () => {
        // api/v1/history
        test('200 OK: ADMIN GET ALL HISTORY NO QUERIES', async () => {

            const response = await request(server)
                .get(`/api/v1/history`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(200);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.payments.length).toEqual(1);
            expect(response.body.data.rides.length).toEqual(2);
        });

        // api/v1/history?userID
        test('200 OK: ADMIN GET ALL USER HISTORY', async () => {

            const response = await request(server)
                .get(`/api/v1/history?userID=${customerID}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(200);
            
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.rides.length).toEqual(1);
            expect(response.body.data.payments.length).toEqual(1);
        });

        // api/v1/history?userID&type=rides
        test('200 OK: ADMIN GET RIDES USERID', async () => {

            const response = await request(server)
                .get(`/api/v1/history?userID=${customerID}&type=rides`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(200);
            
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.rides.length).toEqual(1);
            expect(response.body.data.payments).toEqual(undefined); 
        });

        // api/v1/history?userID&type=payments
        test('200 OK: ADMIN GET RIDES USERID', async () => {

            const response = await request(server)
                .get(`/api/v1/history?userID=${customerID}&type=payments`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(200);
            
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.payments.length).toEqual(1);
            expect(response.body.data.rides).toEqual(undefined); 
        });

        // api/v1/history?userID
        test('200 OK: USER GET USERID', async () => {

            const response = await request(server)
                .get(`/api/v1/history?userID=${customerID}`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(200);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.payments.length).toEqual(1);
            expect(response.body.data.rides.length).toEqual(1); 
        });

        // api/v1/history?userID&type=payments
        test('200 OK: USER GET PAYMENTS USERID', async () => {

            const response = await request(server)
                .get(`/api/v1/history?userID=${customerID}&type=payments`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(200);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.payments.length).toEqual(1);
            expect(response.body.data.rides).toEqual(undefined); 
        });

        // api/v1/history?userID&type=rides
        test('200 OK: USER GET RIDES USERID', async () => {

            const response = await request(server)
                .get(`/api/v1/history?userID=${customerID}&type=rides`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(200);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.rides.length).toEqual(1);
            expect(response.body.data.payments).toEqual(undefined); 
        });

        // api/v1/history
        test('400 BAD REQUEST: INVALID USERID', async () => {

            const response = await request(server)
                .get(`/api/v1/history?userID=a`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual("Invalid ID: a");
        });

        // api/v1/history
        test('400 BAD REQUEST: INCORRECT TYPE', async () => {

            const response = await request(server)
                .get(`/api/v1/history?userID=${customerID}&type=test`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual("Invalid type: test");
        });

        // api/v1/history
        test('400 BAD REQUEST: NO USERID', async () => {

            const response = await request(server)
                .get(`/api/v1/history`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual("Please provide userID field");
        });

        // api/v1/history?userID
        test('404 NOT FOUND: NOT MATCHING USERID', async () => {
            const customer2 = await testHelpers.loginHelper("user1@test.com", process.env.TEST_PASSWORD, false)

            const response = await request(server)
                .get(`/api/v1/history?userID=${customer2.id}`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(404);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Not found");
            expect(response.body.error.message).toEqual("History not found");
        });

    });

    describe('GET api/v1/history/:userID/rides/:rideID', () => {

        test('200 OK: CUSTOMER SUCCESS', async () => {
            const dbRides = await database.getDb("rides");
            const ride = await dbRides.collection.findOne({user: new ObjectId(customerID)});
            const rideID = ride._id;
            dbRides.client.close();
            
            const response = await request(server)
                .get(`/api/v1/history/${customerID}/rides/${rideID}`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(200);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data._id).toEqual(rideID.toString());
            expect(response.body.data.user).toEqual(customerID.toString());
        });

        test('200 OK: ADMIN SUCCESS', async () => {
            const dbRides = await database.getDb("rides");
            const ride = await dbRides.collection.findOne({user: new ObjectId(customerID)});
            const rideID = ride._id;
            dbRides.client.close();
            
            const response = await request(server)
                .get(`/api/v1/history/${customerID}/rides/${rideID}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(200);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data._id).toEqual(rideID.toString());
            expect(response.body.data.user).toEqual(customerID.toString());
        });

        test('400 BAD REQUEST: INVALID USERID', async () => {
            const dbRides = await database.getDb("rides");
            const ride = await dbRides.collection.findOne({user: new ObjectId(customerID)});
            const rideID = ride._id;
            dbRides.client.close();

            const response = await request(server)
                .get(`/api/v1/history/a/rides/${rideID}`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual("Invalid user ID: a");
        });

        test('400 BAD REQUEST: INVALID RIDEID', async () => {
            const response = await request(server)
                .get(`/api/v1/history/${customerID}/rides/a`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual("Invalid ride ID: a");
        });
        
        test('403 FORBIDDEN: CUSTOMER TRY ACCESS OTHER CUSTOMER RIDE', async () => {
            const customer2 = await testHelpers.loginHelper("user2@test.com", process.env.TEST_PASSWORD, false)
            const dbRides = await database.getDb("rides");
            const ride = await dbRides.collection.findOne({user: new ObjectId(customerID)});
            const rideID = ride._id;
            dbRides.client.close();
            
            const response = await request(server)
                .get(`/api/v1/history/${customerID}/rides/${rideID}`)
                .set({ "x-access-token": `${customer2.token}` })
                .expect(403);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Forbidden");
            expect(response.body.error.message).toEqual("You dont have access to this data.");
        });

        test('404 NOT FOUND', async () => {
            const notID = "aaaabbbbccccddddeeeeffff";

            const response = await request(server)
                .get(`/api/v1/history/${customerID}/rides/${notID}`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(404);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Not found");
            expect(response.body.error.message).toEqual(`Ride with id '${notID}' not found.`);
        });
    });

    describe('DELETE api/v1/history/:userID/rides/:rideID', () => {

        test('200 OK: CUSTOMER SUCCESS', async () => {
            const dbRides = await database.getDb("rides");
            const ride = await dbRides.collection.findOne({user: new ObjectId(customerID)});
            const rideID = ride._id;
            dbRides.client.close();
            
            const response = await request(server)
                .delete(`/api/v1/history/${customerID}/rides/${rideID}`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(200);
            
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.message).toEqual("Ride has been deleted");
        });

        test('200 OK: ADMIN SUCCESS', async () => {
            const dbRides = await database.getDb("rides");
            const ride = await dbRides.collection.findOne({user: new ObjectId(customerID)});
            const rideID = ride._id;
            dbRides.client.close();
            
            const response = await request(server)
                .delete(`/api/v1/history/${customerID}/rides/${rideID}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(200);
            
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.message).toEqual("Ride has been deleted");
        });

        test('400 BAD REQUEST: INVALID USERID', async () => {
            const dbRides = await database.getDb("rides");
            const ride = await dbRides.collection.findOne({user: new ObjectId(customerID)});
            const rideID = ride._id;
            dbRides.client.close();

            const response = await request(server)
                .delete(`/api/v1/history/a/rides/${rideID}`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual("Invalid user ID: a");
        });

        test('400 BAD REQUEST: INVALID RIDEID', async () => {
            const response = await request(server)
                .delete(`/api/v1/history/${customerID}/rides/a`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual("Invalid ride ID: a");
        });
        
        test('403 FORBIDDEN: CUSTOMER TRY ACCESS OTHER CUSTOMER RIDE', async () => {
            const customer2 = await testHelpers.loginHelper("user2@test.com", process.env.TEST_PASSWORD, false)
            const dbRides = await database.getDb("rides");
            const ride = await dbRides.collection.findOne({user: new ObjectId(customerID)});
            const rideID = ride._id;
            dbRides.client.close();
            
            const response = await request(server)
                .delete(`/api/v1/history/${customerID}/rides/${rideID}`)
                .set({ "x-access-token": `${customer2.token}` })
                .expect(403);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Forbidden");
            expect(response.body.error.message).toEqual("You dont have access to this data.");
        });

        test('404 NOT FOUND', async () => {
            const notID = "aaaabbbbccccddddeeeeffff";

            const response = await request(server)
                .delete(`/api/v1/history/${customerID}/rides/${notID}`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(404);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Not found");
            expect(response.body.error.message).toEqual(`Ride with id '${notID}' not found.`);
        });

    });

    describe('GET api/v1/history/:userID/payments/:rideID', () => {

        test('200 OK: CUSTOMER SUCCESS', async () => {
            const dbPayments = await database.getDb("payments");
            const payment = await dbPayments.collection.findOne({user: new ObjectId(customerID)});
            const paymentID = payment._id;
            dbPayments.client.close();
            
            const response = await request(server)
                .get(`/api/v1/history/${customerID}/payments/${paymentID}`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(200);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data._id).toEqual(paymentID.toString());
            expect(response.body.data.user).toEqual(customerID.toString());
        });

        test('200 OK: ADMIN SUCCESS', async () => {
            const dbPayments = await database.getDb("payments");
            const payment = await dbPayments.collection.findOne({user: new ObjectId(customerID)});
            const paymentID = payment._id;
            dbPayments.client.close();
            
            const response = await request(server)
                .get(`/api/v1/history/${customerID}/payments/${paymentID}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(200);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data._id).toEqual(paymentID.toString());
            expect(response.body.data.user).toEqual(customerID.toString());
        });

        test('400 BAD REQUEST: INVALID USERID', async () => {
            const dbPayments = await database.getDb("payments");
            const payment = await dbPayments.collection.findOne({user: new ObjectId(customerID)});
            const paymentID = payment._id;
            dbPayments.client.close();

            const response = await request(server)
                .get(`/api/v1/history/a/payments/${paymentID}`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual("Invalid user ID: a");
        });

        test('400 BAD REQUEST: INVALID RIDEID', async () => {
            const response = await request(server)
                .get(`/api/v1/history/${customerID}/payments/a`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual("Invalid payment ID: a");
        });
        
        test('403 FORBIDDEN: CUSTOMER TRY ACCESS OTHER CUSTOMER RIDE', async () => {
            const customer2 = await testHelpers.loginHelper("user2@test.com", process.env.TEST_PASSWORD, false)
            const dbPayments = await database.getDb("payments");
            const payment = await dbPayments.collection.findOne({user: new ObjectId(customerID)});
            const paymentID = payment._id;
            dbPayments.client.close();
            
            const response = await request(server)
                .get(`/api/v1/history/${customerID}/payments/${paymentID}`)
                .set({ "x-access-token": `${customer2.token}` })
                .expect(403);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Forbidden");
            expect(response.body.error.message).toEqual("You dont have access to this data.");
        });

        test('404 NOT FOUND', async () => {
            const notID = "aaaabbbbccccddddeeeeffff";

            const response = await request(server)
                .get(`/api/v1/history/${customerID}/payments/${notID}`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(404);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Not found");
            expect(response.body.error.message).toEqual(`Payment with id '${notID}' not found.`);
        });
    });

    describe('DELETE api/v1/history/:userID/payments/:paymentID', () => {

        test('200 OK: CUSTOMER SUCCESS', async () => {
            const dbPayments = await database.getDb("payments");
            const payment = await dbPayments.collection.findOne({user: new ObjectId(customerID)});
            const paymentID = payment._id;
            dbPayments.client.close();
            
            const response = await request(server)
                .delete(`/api/v1/history/${customerID}/payments/${paymentID}`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(200);
            
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.message).toEqual("Payment has been deleted");
        });

        test('200 OK: ADMIN SUCCESS', async () => {
            const dbPayments = await database.getDb("payments");
            const payment = await dbPayments.collection.findOne({user: new ObjectId(customerID)});
            const paymentID = payment._id;
            dbPayments.client.close();
            
            const response = await request(server)
                .delete(`/api/v1/history/${customerID}/payments/${paymentID}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(200);
            
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.message).toEqual("Payment has been deleted");
        });
 
        test('400 BAD REQUEST: INVALID USERID', async () => {
            const dbPayments = await database.getDb("payments");
            const payment = await dbPayments.collection.findOne({user: new ObjectId(customerID)});
            const paymentID = payment._id;
            dbPayments.client.close();

            const response = await request(server)
                .delete(`/api/v1/history/a/payments/${paymentID}`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual("Invalid user ID: a");
        });

        test('400 BAD REQUEST: INVALID RIDEID', async () => {
            const response = await request(server)
                .delete(`/api/v1/history/${customerID}/payments/a`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual("Invalid payment ID: a");
        });
        
        test('403 FORBIDDEN: CUSTOMER TRY ACCESS OTHER CUSTOMER RIDE', async () => {
            const customer2 = await testHelpers.loginHelper("user2@test.com", process.env.TEST_PASSWORD, false)
            const dbPayments = await database.getDb("payments");
            const payment = await dbPayments.collection.findOne({user: new ObjectId(customerID)});
            const paymentID = payment._id;
            dbPayments.client.close();
            
            const response = await request(server)
                .delete(`/api/v1/history/${customerID}/payments/${paymentID}`)
                .set({ "x-access-token": `${customer2.token}` })
                .expect(403);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Forbidden");
            expect(response.body.error.message).toEqual("You dont have access to this data.");
        });

        test('404 NOT FOUND', async () => {
            const notID = "aaaabbbbccccddddeeeeffff";

            const response = await request(server)
                .delete(`/api/v1/history/${customerID}/payments/${notID}`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(404);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Not found");
            expect(response.body.error.message).toEqual(`Payment with id '${notID}' not found.`);
        });

    });

});
process.env.NODE_ENV = 'test';

const ObjectId = require('mongodb').ObjectId;
const request = require('supertest');
const server = require('./../app.js');
const jwt = require("jsonwebtoken");
const database = require("../database/database");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


let customerID = "";
let customerToken = "";
let adminID = "";
let adminToken = "";
let bike = {};

const STRIPE_PM = {
    success: "pm_card_visa",
    decline: "pm_card_visa_chargeDeclined",
    auth: "pm_card_authenticationRequired",
    cvc: "pm_card_cvcCheckFail"
}

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

describe('Payment', () => {
    describe('POST api/v1/payment/:userID/fill', () => {
        //paymentMethod = getPaymentMethod(stripeSuccess, "123");
        test('400 BAD REQUEST: NO PAYMENT METHOD ID', async () => {
            const response = await request(server)
                .post(`/api/v1/payment/${customerID}/fill`)
                .set({ "x-access-token": `${adminToken}` })
                .send({amount: 100})
                .expect(400);
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad Request");
            expect(response.body.error.message).toEqual("Payment method ID is missing");
        });

        test('400 BAD REQUEST: FLOAT AMOUNT', async () => {
            const response = await request(server)
                .post(`/api/v1/payment/${customerID}/fill`)
                .set({ "x-access-token": `${adminToken}` })
                .send({amount: 10.999, payMethodID: STRIPE_PM.success})
                .expect(400);
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad Request");
            expect(response.body.error.message).toEqual("Amount needs to an integer");
        });

        test('400 BAD REQUEST: AMOUNT 0', async () => {
            const response = await request(server)
                .post(`/api/v1/payment/${customerID}/fill`)
                .set({ "x-access-token": `${adminToken}` })
                .send({amount: 0, payMethodID: STRIPE_PM.success})
                .expect(400);
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad Request");
            expect(response.body.error.message).toEqual("Amount needs to be greater than 3sek");
        });

        test('400 BAD REQUEST: AMOUNT BELOW MIN', async () => {
            const response = await request(server)
                .post(`/api/v1/payment/${customerID}/fill`)
                .set({ "x-access-token": `${adminToken}` })
                .send({amount: 3, payMethodID: STRIPE_PM.success})
                .expect(400);
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad Request");
            expect(response.body.error.message).toEqual("Amount needs to be greater than 3sek");
        });

        test('403 FORBIDDEN: FILL OTHER BALANCE', async () => {
            const customerID2 = customerID;
            const _ = await loginHelper("user1@test.com", process.env.TEST_PASSWORD, false)
            
            const response = await request(server)
                .post(`/api/v1/payment/${customerID2}/fill`)
                .set({ "x-access-token": `${customerToken}` })
                .send({amount: 200, payMethodID: STRIPE_PM.success})
                .expect(403);
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Forbidden");
            expect(response.body.error.message).toEqual("Cannot fill balance of other user");
        });

        test('200 SUCCESS: FILL BALANCE', async () => {
            const response = await request(server)
                .post(`/api/v1/payment/${customerID}/fill`)
                .set({ "x-access-token": `${customerToken}` })
                .send({amount: 200, payMethodID: STRIPE_PM.success})
                .expect(200);
            
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.status).toEqual("success");
            expect(response.body.paymentID).toBeDefined();
            expect(response.body.amount).toEqual(200);
            expect(response.body.balance).toEqual(400);
        });

        test('200 SUCCESS: ADMIN FILL BALANCE', async () => {
            const response = await request(server)
                .post(`/api/v1/payment/${customerID}/fill`)
                .set({ "x-access-token": `${adminToken}` })
                .send({amount: 200, payMethodID: STRIPE_PM.success})
                .expect(200);
            
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.status).toEqual("success");
            expect(response.body.paymentID).toBeDefined();
            expect(response.body.amount).toEqual(200);
            expect(response.body.balance).toEqual(400);
        });

        test('200 SUCCESS: REQUIRES ACTION', async () => {
            const response = await request(server)
                .post(`/api/v1/payment/${customerID}/fill`)
                .set({ "x-access-token": `${customerToken}` })
                .send({amount: 200, payMethodID: STRIPE_PM.auth})
                .expect(200);
            
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.status).toEqual("action_required");
            expect(response.body.paymentID).toBeDefined();
        });
    });
});
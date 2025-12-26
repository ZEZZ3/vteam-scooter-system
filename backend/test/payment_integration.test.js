process.env.NODE_ENV = 'test';

const request = require('supertest');
const server = require('./../app.js');
const testHelpers = require("./testHelpers");

let customerID = "";
let customerToken = "";
let adminID = "";
let adminToken = "";

const STRIPE_PM = {
    success: "pm_card_visa",
    decline: "pm_card_visa_chargeDeclined",
    auth: "pm_card_authenticationRequired",
    funds: "pm_card_visa_chargeDeclinedInsufficientFunds"
}

const clearDatabase = require("./clearDatabase");
const baseData = require("./baseData");

beforeEach(async () => {
    await clearDatabase();
    await baseData.baseUserData();
    await baseData.baseBikeData();
    await baseData.baseRideData();

    const admin = await testHelpers.loginHelper("admin@test.com", process.env.TEST_PASSWORD, true)
    const customer = await testHelpers.loginHelper("user@test.com", process.env.TEST_PASSWORD, false)
    
    adminToken = admin.token;
    adminID = admin.id;
    customerToken = customer.token;
    customerID = customer.id;
});

describe('Payment', () => {
    describe('POST api/v1/payment/:userID/fill', () => {
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

        test('400 PAYMENT DECLINE', async () => {
            const response = await request(server)
                .post(`/api/v1/payment/${customerID}/fill`)
                .set({ "x-access-token": `${customerToken}` })
                .send({amount: 200, payMethodID: STRIPE_PM.decline})
                .expect(400);
            
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Declined");
            expect(response.body.error.message).toEqual("Your card was declined.");
        });

        test('400 PAYMENT FAIL: INSUFFICIENT FUNDS', async () => {
            const response = await request(server)
                .post(`/api/v1/payment/${customerID}/fill`)
                .set({ "x-access-token": `${customerToken}` })
                .send({amount: 200, payMethodID: STRIPE_PM.funds})
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Declined");
            expect(response.body.error.message).toEqual("Your card has insufficient funds.");
        });

        test('403 FORBIDDEN: FILL OTHER BALANCE', async () => {
            const customerID2 = customerID;
            const customer = await testHelpers.loginHelper("user1@test.com", process.env.TEST_PASSWORD, false)
            
            const response = await request(server)
                .post(`/api/v1/payment/${customerID2}/fill`)
                .set({ "x-access-token": `${customer.token}` })
                .send({amount: 200, payMethodID: STRIPE_PM.success})
                .expect(403);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Forbidden");
            expect(response.body.error.message).toEqual("Cannot fill balance of other user");
        });
    });
});
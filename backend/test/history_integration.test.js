process.env.NODE_ENV = 'test';

const request = require('supertest');
const server = require('./../app.js');
const database = require("../database/database")
const clearDatabase = require("./clearDatabase");
const baseData = require("./baseData");
const testHelpers = require("./testHelpers");

let customerToken = "";
let customerID = "";
let adminToken = "";
let adminID = "";

beforeEach(async () => {
    await clearDatabase();
    await baseData.baseUserData();
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
                .get(`/api/v1/bikes`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(200);
            
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.status).toEqual("V1 up and running");
            expect(response.body.time).toBeDefined();
        });

        test('400 BAD REQUEST: USER GET ALL HISTORY NO QUERIES', async () => {

            const response = await request(server)
                .get(`/api/v1/bikes`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(200);
            
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.status).toEqual("V1 up and running");
            expect(response.body.time).toBeDefined();
        });
    });
});
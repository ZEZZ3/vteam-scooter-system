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
    await baseData.baseCityData();
    await baseData.baseBikeData();

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
});
process.env.NODE_ENV = 'test';

const ObjectId = require('mongodb').ObjectId;
const request = require('supertest');
const server = require('./../app.js');
const jwt = require("jsonwebtoken");
const database = require("../database/database")
const clearDatabase = require("./clearDatabase");
const baseData = require("./baseData");

let customerID = "";
let customerToken = "";
let adminID = "";
let adminToken = "";

beforeEach(async () => {
    await clearDatabase();
    await baseData.baseUserData();
});

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

describe('Users', () => {

    describe('POST api/v1/users/login', () => {

        test('400 BAD REQUEST: NO EMAIL', async () => {
            const response = await request(server)
                .post('/api/v1/users/login')
                .send({ password: process.env.TEST_PASSWORD })
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Email or password missing");
        });

        test('400 BAD REQUEST: NO PASSWORD', async () => {
            const response = await request(server)
                .post('/api/v1/users/login')
                .send({ mail: "admin@test.com" })
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Email or password missing");
        });

        test('401 UNAUTHORIZED: WRONG EMAIL', async () => {
            const response = await request(server)
                .post('/api/v1/users/login')
                .send({ mail: "wrong@gmail.com", password: process.env.TEST_PASSWORD })
                .expect(401);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("User not found");
        });

        test('401 UNAUTHORIZED: WRONG PASSWORD', async () => {
            const response = await request(server)
                .post('/api/v1/users/login')
                .send({ mail: "admin@test.com", password: "wrong"})
                .expect(401);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Wrong password");
        });

        test('SUCCESS LOGIN: ADMIN', async () => {
            const response = await loginHelper("admin@test.com", process.env.TEST_PASSWORD, true)

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.type).toEqual("success");
            expect(adminToken).toBeDefined();
            expect(adminID).toBeDefined();
        });

        test('SUCCESS LOGIN: CUSTOMER', async () => {
            const response = await loginHelper("user@test.com", process.env.TEST_PASSWORD, false);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.type).toEqual("success");
            expect(customerToken).toBeDefined();
            expect(customerID).toBeDefined();
        });
    });

    describe('GET api/v1/users/', () => {
        test('200 OK', async () => {
            const response = await request(server)
                .get('/api/v1/users/')
                .set({ "x-access-token": `${adminToken}` })
                .expect(200);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.length).toEqual(4);
        });

        test('403 FORBIDDEN: CUTOMER', async () => {
            const response = await request(server)
                .get('/api/v1/users/')
                .set({ "x-access-token": `${customerToken}` })
                .expect(403);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Forbidden");
        });
    });

    describe('POST api/v1/users/', () => {
        test('201 CREATED: NEW USER REGISTERED', async () => {

            const userInfo = {
                mail: "test1@test.com",
                password: process.env.TEST_PASSWORD,
                firstName: "Förnamn",
                lastName: "Efternamn",
                adress: "Adress",
                postcode: "33040",
                city: "Stad",
                phone: "Telefon",
                role: "admin"
            }

            const response = await request(server)
                .post('/api/v1/users/')
                .set({ "x-access-token": `${adminToken}` })
                .send(userInfo)
                .expect(201);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.message).toEqual("User successfully registered.")


            const db = await database.getDb("users")
            const user = await db.collection.findOne({ mail: "test1@test.com"});
            expect(user).toBeDefined()
            expect(user.mail).toEqual(userInfo.mail);
            expect(user.password).not.toEqual(userInfo.password);
            expect(user.firstName).toEqual(userInfo.firstName);
            expect(user.lastName).toEqual(userInfo.lastName);
            expect(user.adress).toEqual(userInfo.adress);
            expect(user.postcode).toEqual(userInfo.postcode);
            expect(user.city).toEqual(userInfo.city);
            expect(user.phone).toEqual(userInfo.phone);
            expect(user.role).toEqual("admin");
            expect(user.balance).toEqual(0);

            await db.client.close();
        });

        test('400 BAD REQUEST: NO EMAIL', async () => {

            const userInfo = {
                password: process.env.TEST_PASSWORD,
                firstName: "Förnamn",
                lastName: "Efternamn",
                adress: "Adress",
                postcode: "33040",
                city: "Stad",
                phone: "Telefon",
                role: "admin"
            }

            const response = await request(server)
                .post('/api/v1/users/')
                .set({ "x-access-token": `${adminToken}` })
                .send(userInfo)
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Email or password missing");
        });

        test('400 BAD REQUEST: INVALID EMAIL', async () => {

            const userInfo = {
                mail: "test1test.com",
                password: process.env.TEST_PASSWORD,
                firstName: "Förnamn",
                lastName: "Efternamn",
                adress: "Adress",
                postcode: "33040",
                city: "Stad",
                phone: "Telefon",
                role: ""
            }

            const response = await request(server)
                .post('/api/v1/users/')
                .set({ "x-access-token": `${adminToken}` })
                .send(userInfo)
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Not a valid role");
        });

        test('400 BAD REQUEST: NO PASSWORD', async () => {

            const userInfo = {
                mail: "test1@test.com",
                firstName: "Förnamn",
                lastName: "Efternamn",
                adress: "Adress",
                postcode: "33040",
                city: "Stad",
                phone: "Telefon",
                role: "admin"
            }

            const response = await request(server)
                .post('/api/v1/users/')
                .set({ "x-access-token": `${adminToken}` })
                .send(userInfo)
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Email or password missing");
        });

        test('400 BAD REQUEST: INVALID ROLE', async () => {

            const userInfo = {
                mail: "test1@test.com",
                password: process.env.TEST_PASSWORD,
                firstName: "Förnamn",
                lastName: "Efternamn",
                adress: "Adress",
                postcode: "33040",
                city: "Stad",
                phone: "Telefon",
                role: ""
            }

            const response = await request(server)
                .post('/api/v1/users/')
                .set({ "x-access-token": `${adminToken}` })
                .send(userInfo)
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Not a valid role");
        });

        test('403 FORBIDDEN: CUSTOMER ADD USER', async () => {

            const userInfo = {
                mail: "test1@test.com",
                password: process.env.TEST_PASSWORD,
                firstName: "Förnamn",
                lastName: "Efternamn",
                adress: "Adress",
                postcode: "33040",
                city: "Stad",
                phone: "Telefon",
                role: "admin"
            }

            const response = await request(server)
                .post('/api/v1/users/')
                .set({ "x-access-token": `${customerToken}` })
                .send(userInfo)
                .expect(403);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Forbidden");
        });

    });

    describe('POST api/v1/users/register', () => {
        test('201 CREATED: NEW USER REGISTERED', async () => {

            const userInfo = {
                mail: "test2@test.com",
                password: process.env.TEST_PASSWORD,
                firstName: "Förnamn",
                lastName: "Efternamn",
                adress: "Adress",
                postcode: "33040",
                city: "Stad",
                phone: "Telefon",
                role: "admin"
            }

            const response = await request(server)
                .post('/api/v1/users/register')
                .send(userInfo)
                .expect(201);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.message).toEqual("User successfully registered.")

            const db = await database.getDb("users")

            const user = await db.collection.findOne({ mail: "test2@test.com"});

            expect(user).toBeDefined()
            expect(user.mail).toEqual(userInfo.mail);
            expect(user.password).not.toEqual(userInfo.password);
            expect(user.firstName).toEqual(userInfo.firstName);
            expect(user.lastName).toEqual(userInfo.lastName);
            expect(user.adress).toEqual(userInfo.adress);
            expect(user.postcode).toEqual(userInfo.postcode);
            expect(user.city).toEqual(userInfo.city);
            expect(user.phone).toEqual(userInfo.phone);
            expect(user.role).toEqual("customer");
            expect(user.balance).toEqual(0);
            expect(user.verified).toEqual(false);
            expect(user.verificationToken).toBeDefined();
            expect(user.tokenExpires).toBeDefined();

            await db.client.close();
        });
        
        test('400 BAD REQUEST: NO EMAIL', async () => {

            const userInfo = {
                password: process.env.TEST_PASSWORD,
                firstName: "Förnamn",
                lastName: "Efternamn",
                adress: "Adress",
                postcode: "33040",
                city: "Stad",
                phone: "Telefon",
                role: "admin"
            }

            const response = await request(server)
                .post('/api/v1/users/register')
                .send(userInfo)
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Email or password missing");
        });

        test('400 BAD REQUEST: NO PASSWORD', async () => {

            const userInfo = {
                mail: "test2@test.com",
                firstName: "Förnamn",
                lastName: "Efternamn",
                adress: "Adress",
                postcode: "33040",
                city: "Stad",
                phone: "Telefon",
                role: "admin"
            }

            const response = await request(server)
                .post('/api/v1/users/register')
                .send(userInfo)
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Email or password missing");
        });

        test('400 BAD REQUEST: INVALID EMAIL', async () => {

            const userInfo = {
                mail: "test2test.com",
                password: process.env.TEST_PASSWORD,
                firstName: "Förnamn",
                lastName: "Efternamn",
                adress: "Adress",
                postcode: "33040",
                city: "Stad",
                phone: "Telefon",
                role: "admin"
            }

            const response = await request(server)
                .post('/api/v1/users/register')
                .send(userInfo)
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Not a valid email");
        });

        test('409 CONFLICT: USER ALREADY EXISTS', async () => {

            const userInfo = {
                mail: "test2@test.com",
                password: process.env.TEST_PASSWORD,
                firstName: "Förnamn",
                lastName: "Efternamn",
                adress: "Adress",
                postcode: "33040",
                city: "Stad",
                phone: "Telefon",
                role: "admin"
            }

            let response = await request(server)
                .post('/api/v1/users/register')
                .send(userInfo)
                .expect(201);


            response = await request(server)
                .post('/api/v1/users/register')
                .send(userInfo)
                .expect(409);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("User already exists");
        });
    });

    describe('GET api/v1/users/:id', () => {
        test('200 OK: ADMIN GET ADMIN WITH ID', async () => {
            const _ = await loginHelper("admin@test.com", process.env.TEST_PASSWORD, true)

            const response = await request(server)
                .get(`/api/v1/users/${adminID}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(200);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data._id).toEqual(adminID);
            expect(response.body.data.mail).toEqual("admin@test.com");
        });

        test('200 OK: ADMIN GET CUSTOMER WITH ID', async () => {

            const _ = await loginHelper("admin@test.com", process.env.TEST_PASSWORD, true)
            const __ = await loginHelper("user@test.com", process.env.TEST_PASSWORD, false)

            const response = await request(server)
                .get(`/api/v1/users/${customerID}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(200);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data._id).toEqual(customerID);
            expect(response.body.data.mail).toEqual("user@test.com");
        });

        test('200 OK: CUSTOMER GET SELF WITH ID', async () => {
            const _ = await loginHelper("user@test.com", process.env.TEST_PASSWORD, false)

            const response = await request(server)
                .get(`/api/v1/users/${customerID}`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(200);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data._id).toEqual(customerID);
            expect(response.body.data.mail).toEqual("user@test.com");
        });

        test('400 BAD REQUEST: INVALID ID', async () => {
            const _ = await loginHelper("user@test.com", process.env.TEST_PASSWORD, false)
            const __ = await loginHelper("admin@test.com", process.env.TEST_PASSWORD, true)
            const notID = "a";
            const response = await request(server)
                .get(`/api/v1/users/${notID}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual(`Invalid ID: ${notID}`);
        });

        test('403 FORBIDDEN: CUSTOMER GET ELSE WITH ID', async () => {
            const _ = await loginHelper("user@test.com", process.env.TEST_PASSWORD, false)
            const __ = await loginHelper("admin@test.com", process.env.TEST_PASSWORD, true)

            const response = await request(server)
                .get(`/api/v1/users/${adminID}`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(403);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Forbidden");
        });

        test('404 NOT FOUND: USER', async () => {
            const _ = await loginHelper("user@test.com", process.env.TEST_PASSWORD, false)
            const __ = await loginHelper("admin@test.com", process.env.TEST_PASSWORD, true)
            const notID = "aaaabbbbccccddddeeeeffff";
            const response = await request(server)
                .get(`/api/v1/users/${notID}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(404);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Not found");
        });
    });

    describe('PUT api/v1/users/:id', () => {

        test('200 OK: ADMIN UPDATE CUSTOMER', async () => {
            const _ = await loginHelper("admin@test.com", process.env.TEST_PASSWORD, true)
            const __ = await loginHelper("user@test.com", process.env.TEST_PASSWORD, false)

            const updateWith = {
                firstName: "the new first name",
                lastName: "the new last name",
                adress: "the new adress",
                postcode: "the new postcode",
                city: "the new city",
                phone: "987654321",
                password: "Test123!", 
            }

            const response = await request(server)
                .put(`/api/v1/users/${customerID}`)
                .set({ "x-access-token": `${adminToken}` })
                .send(updateWith)
                .expect(200);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.firstName).toEqual(updateWith.firstName);
            expect(response.body.data.lastName).toEqual(updateWith.lastName);
            expect(response.body.data.adress).toEqual(updateWith.adress);
            expect(response.body.data.postcode).toEqual(updateWith.postcode);
            expect(response.body.data.city).toEqual(updateWith.city);
            expect(response.body.data.phone).toEqual(updateWith.phone);
            expect(response.body.data.password).not.toBeDefined();
            expect(response.body.data.role).toEqual("customer");
        });

        test('200 OK: CUSTOMER UPDATE CUSTOMER', async () => {
            const __ = await loginHelper("user@test.com", process.env.TEST_PASSWORD, false)

            const updateWith = {
                firstName: "the new first name1",
                lastName: "the new last name1",
                adress: "the new adress1",
                postcode: "the new postcode1",
                city: "the new city1",
                phone: "982354321",
                password: "Test123!", 
            }

            const response = await request(server)
                .put(`/api/v1/users/${customerID}`)
                .set({ "x-access-token": `${customerToken}` })
                .send(updateWith)
                .expect(200);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.firstName).toEqual(updateWith.firstName);
            expect(response.body.data.lastName).toEqual(updateWith.lastName);
            expect(response.body.data.adress).toEqual(updateWith.adress);
            expect(response.body.data.postcode).toEqual(updateWith.postcode);
            expect(response.body.data.city).toEqual(updateWith.city);
            expect(response.body.data.phone).toEqual(updateWith.phone);
            expect(response.body.data.password).not.toBeDefined();
            expect(response.body.data.role).toEqual("customer");
        });

        test('200 OK: ADMIN UPDATE ADMIN', async () => {
            const _ = await loginHelper("admin@test.com", process.env.TEST_PASSWORD, true)
            const __ = await loginHelper("user@test.com", process.env.TEST_PASSWORD, false)

            const updateWith = {
                firstName: "the new first name1",
                lastName: "the new last name1",
                adress: "the new adress1",
                postcode: "the new postcode1",
                city: "the new city1",
                phone: "982354321",
                password: "Test123!", 
            }

            const response = await request(server)
                .put(`/api/v1/users/${adminID}`)
                .set({ "x-access-token": `${adminToken}` })
                .send(updateWith)
                .expect(200);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.firstName).toEqual(updateWith.firstName);
            expect(response.body.data.lastName).toEqual(updateWith.lastName);
            expect(response.body.data.adress).toEqual(updateWith.adress);
            expect(response.body.data.postcode).toEqual(updateWith.postcode);
            expect(response.body.data.city).toEqual(updateWith.city);
            expect(response.body.data.phone).toEqual(updateWith.phone);
            expect(response.body.data.password).not.toBeDefined();
            expect(response.body.data.role).toEqual("admin");
        });

        test('400 BAD REQUEST: INVALID ID', async () => {
            const __ = await loginHelper("admin@test.com", process.env.TEST_PASSWORD, true)
            const notID = "a";
            const response = await request(server)
                .put(`/api/v1/users/${notID}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual(`Invalid ID: ${notID}`);
        });

        test('400 BAD REQUEST: MISSING FIELD', async () => {
            const _ = await loginHelper("admin@test.com", process.env.TEST_PASSWORD, true)
            const __ = await loginHelper("user@test.com", process.env.TEST_PASSWORD, false)

            const updateWith = {
                lastName: "the new last name",
                adress: "the new adress",
                postcode: "the new postcode",
                city: "the new city",
                password: "Test123!", 
            }

            const response = await request(server)
                .put(`/api/v1/users/${customerID}`)
                .set({ "x-access-token": `${adminToken}` })
                .send(updateWith)
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual("Missing field: firstName");
        });

        test('403 FORBIDDEN: CUSTOMER EDIT ADMIN', async () => {
            const _ = await loginHelper("user@test.com", process.env.TEST_PASSWORD, false)

            const updateWith = {
                firstName: "the new first name",
                lastName: "the new last name",
                adress: "the new adress",
                postcode: "the new postcode",
                city: "the new city",
                phone: "the new phone",
                password: "Test123!"
            }

            const response = await request(server)
                .put(`/api/v1/users/${adminID}`)
                .set({ "x-access-token": `${customerToken}` })
                .send(updateWith)
                .expect(403);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Forbidden");
        });

        test('404 NOT FOUND: USER NOT FOUND', async () => {
            const _ = await loginHelper("admin@test.com", process.env.TEST_PASSWORD, true)

            const updateWith = {
                firstName: "the new first name",
                lastName: "the new last name",
                adress: "the new adress",
                postcode: "the new postcode",
                city: "the new city",
                phone: "the new phone",
                password: "Test123!"
            }

            const notID = "aaaabbbbccccddddeeeeffff";

            const response = await request(server)
                .put(`/api/v1/users/${notID}`)
                .set({ "x-access-token": `${adminToken}` })
                .send(updateWith)
                .expect(404);
                
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Not found");
        });
    });

    describe('PATCH api/v1/users/:id', () => {

        test('200 OK: ADMIN UPDATE CUSTOMER', async () => {
            const _ = await loginHelper("admin@test.com", process.env.TEST_PASSWORD, true)
            const __ = await loginHelper("user@test.com", process.env.TEST_PASSWORD, false)

            const updateWith = {
                lastName: "the new last name",
                city: "the new city",
            }

            const response = await request(server)
                .patch(`/api/v1/users/${customerID}`)
                .set({ "x-access-token": `${adminToken}` })
                .send(updateWith)
                .expect(200);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.firstName).not.toBeDefined();
            expect(response.body.data.lastName).toEqual("the new last name");
            expect(response.body.data.adress).not.toBeDefined();
            expect(response.body.data.postcode).not.toBeDefined();
            expect(response.body.data.city).toEqual("the new city");
            expect(response.body.data.phone).toEqual("012345678");
            expect(response.body.data.password).not.toBeDefined();
            expect(response.body.data.role).toEqual("customer");

        });

        test('200 OK: CUSTOMER UPDATE CUSTOMER', async () => {
            const __ = await loginHelper("user@test.com", process.env.TEST_PASSWORD, false)

            const updateWith = {
                lastName: "the new last name",
                city: "the new city",
            }

            const response = await request(server)
                .patch(`/api/v1/users/${customerID}`)
                .set({ "x-access-token": `${customerToken}` })
                .send(updateWith)
                .expect(200);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.firstName).not.toBeDefined();
            expect(response.body.data.lastName).toEqual("the new last name");
            expect(response.body.data.adress).not.toBeDefined();
            expect(response.body.data.postcode).not.toBeDefined();
            expect(response.body.data.city).toEqual("the new city");
            expect(response.body.data.phone).toEqual("012345678");
            expect(response.body.data.password).not.toBeDefined();
            expect(response.body.data.role).toEqual("customer");
        });

        test('200 OK: ADMIN UPDATE ADMIN', async () => {
            const _ = await loginHelper("admin@test.com", process.env.TEST_PASSWORD, true)
            const __ = await loginHelper("user@test.com", process.env.TEST_PASSWORD, false)

            const updateWith = {
                lastName: "the new last name",
                city: "the new city",
            }

            const response = await request(server)
                .patch(`/api/v1/users/${adminID}`)
                .set({ "x-access-token": `${adminToken}` })
                .send(updateWith)
                .expect(200);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.firstName).not.toBeDefined();
            expect(response.body.data.lastName).toEqual("the new last name");
            expect(response.body.data.adress).not.toBeDefined();
            expect(response.body.data.postcode).not.toBeDefined();
            expect(response.body.data.city).toEqual("the new city");
            expect(response.body.data.phone).toEqual("123456789");
            expect(response.body.data.password).not.toBeDefined();
            expect(response.body.data.role).toEqual("admin");
        });

        test('400 BAD REQUEST: INVALID ID', async () => {
            const __ = await loginHelper("admin@test.com", process.env.TEST_PASSWORD, true)
            const notID = "a";
            const response = await request(server)
                .patch(`/api/v1/users/${notID}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual(`Invalid ID: ${notID}`);
        });

        test('400 BAD REQUEST: NO DATA', async () => {
            const __ = await loginHelper("user@test.com", process.env.TEST_PASSWORD, false)
            
            const response = await request(server)
                .patch(`/api/v1/users/${customerID}`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual("No data to update");
        });

        test('403 FORBIDDEN: CUSTOMER EDIT ADMIN', async () => {
            const _ = await loginHelper("user@test.com", process.env.TEST_PASSWORD, false)
            const __ = await loginHelper("admin@test.com", process.env.TEST_PASSWORD, true)

            const updateWith = {
                lastName: "the new last name",
                city: "the new city",
            }

            const response = await request(server)
                .patch(`/api/v1/users/${adminID}`)
                .set({ "x-access-token": `${customerToken}` })
                .send(updateWith)
                .expect(403);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Forbidden");
        });

        test('404 NOT FOUND: USER NOT FOUND', async () => {
            const _ = await loginHelper("admin@test.com", process.env.TEST_PASSWORD, true)

            const updateWith = {
                lastName: "the new last name",
                city: "the new city",
            }

            const notID = "aaaabbbbccccddddeeeeffff";

            const response = await request(server)
                .patch(`/api/v1/users/${notID}`)
                .set({ "x-access-token": `${adminToken}` })
                .send(updateWith)
                .expect(404);
                
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Not found");
        });
    });

    describe('DELETE api/v1/users/:id', () => {

        test('200 OK: ADMIN DELETE CUSTOMER', async () => {
            const _ = await loginHelper("admin@test.com", process.env.TEST_PASSWORD, true)
            const __ = await loginHelper("user@test.com", process.env.TEST_PASSWORD, false)

            const response = await request(server)
                .delete(`/api/v1/users/${customerID}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(200);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.message).toEqual("User has been deleted");
        });

        test('200 OK: CUSTOMER DELETE CUSTOMER', async () => {
            const __ = await loginHelper("user@test.com", process.env.TEST_PASSWORD, false)

            const response = await request(server)
                .delete(`/api/v1/users/${customerID}`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(200);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.message).toEqual("User has been deleted");
        });

        test('400 BAD REQUEST: INVALID ID', async () => {
            const __ = await loginHelper("admin@test.com", process.env.TEST_PASSWORD, true)
            
            const notID = "a";

            const response = await request(server)
                .delete(`/api/v1/users/${notID}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual(`Invalid ID: ${notID}`);
        });

        test('403 FORBIDDEN: CUSTOMER DELETE ADMIN', async () => {
            const _ = await loginHelper("admin@test.com", process.env.TEST_PASSWORD, true)
            const __ = await loginHelper("user@test.com", process.env.TEST_PASSWORD, false)

            const response = await request(server)
                .delete(`/api/v1/users/${adminID}`)
                .set({ "x-access-token": `${customerToken}` })
                .expect(403);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Forbidden");
            expect(response.body.error.message).toEqual("You dont have access to this functionality.");
        });

        test('404 NOT FOUND: USER NOT FOUND', async () => {
            const _ = await loginHelper("admin@test.com", process.env.TEST_PASSWORD, true)

            const notID = "aaaabbbbccccddddeeeeffff";

            const response = await request(server)
                .delete(`/api/v1/users/${notID}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(404);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Not found");
            expect(response.body.error.message).toEqual(`User with id '${notID}' not found.`);
        });
    });

    describe('GET api/v1/users/verify', () => {

        test('200 VERIFIED: NEW USER VERIFIED', async () => {

            const userInfo = {
                mail: "test2@test.com",
                password: process.env.TEST_PASSWORD,
                firstName: "Förnamn",
                lastName: "Efternamn",
                adress: "Adress",
                postcode: "33040",
                city: "Stad",
                phone: "Telefon",
            }

            const response = await request(server)
                .post('/api/v1/users/register')
                .send(userInfo)
                .expect(201);

            const db = await database.getDb("users")
            const user = await db.collection.findOne({ mail: "test2@test.com"});
            const verificationToken = user.verificationToken;
            await db.client.close();

            const verify = await request(server)
                .get(`/api/v1/users/verify?token=${verificationToken}`)
                .expect(200);

            expect(verify.body).toEqual(expect.any(Object));
            expect(verify.body.data.message).toEqual("User has been verified");            

        });

        test('400 BAD REQUEST: NO TOKEN', async () => {

            const response = await request(server)
                .get(`/api/v1/users/verify?token=`)
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual("Token is required");
        });

        test('400 BAD REQUEST: EXPIRED TOKEN', async () => {
            
            const userInfo = {
                mail: "test2@test.com",
                password: process.env.TEST_PASSWORD,
                firstName: "Förnamn",
                lastName: "Efternamn",
                adress: "Adress",
                postcode: "33040",
                city: "Stad",
                phone: "Telefon",
            }

            const response = await request(server)
                .post('/api/v1/users/register')
                .send(userInfo)
                .expect(201);

            const db = await database.getDb("users")
            const user = await db.collection.findOne({ mail: "test2@test.com"});
            
            const newData = {
                tokenExpires: Date.now() - 1000 * 60 * 31
            }
    
            const update = await db.collection.findOneAndUpdate(
                { _id: new ObjectId(user._id) },
                { $set: newData }
            );

            await db.client.close();

            const verificationToken = user.verificationToken;
            
            const verify = await request(server)
                .get(`/api/v1/users/verify?token=${verificationToken}`)
                .expect(400);

            expect(verify.body).toEqual(expect.any(Object));
            expect(verify.body.error.title).toEqual("Token has expired");
            expect(verify.body.error.message).toEqual("Verification token has expired. A token is only valid for 30 minutes.");

        });

        test('404 NOT FOUND: UNKOWN TOKEN', async () => {

            const response = await request(server)
                .get(`/api/v1/users/verify?token=a`)
                .expect(404);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Not found");
            expect(response.body.error.message).toEqual("Token not found");
        });
    });

});

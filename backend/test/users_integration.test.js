process.env.NODE_ENV = 'test';

const request = require('supertest');
const server = require('./../app.js');
const jwt = require("jsonwebtoken");
const database = require("../database/database")

let customerID = "";
let customerToken = "";
let adminID = "";
let adminToken = "";

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
        test('403 FORBIDDEN: CUTOMER', async () => {
            const response = await request(server)
                .get('/api/v1/users/')
                .set({ "x-access-token": `${customerToken}` })
                .expect(403);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Forbidden");
        });

        test('200 OK', async () => {
            const response = await request(server)
                .get('/api/v1/users/')
                .set({ "x-access-token": `${adminToken}` })
                .expect(200);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.length).toEqual(2);
        });
    });

    describe('POST api/v1/users/', () => {
        test('403 FORBIDDEN', async () => {

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
    });

    describe('POST api/v1/users/register', () => {
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

            await db.client.close();
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
        });

    });

    describe('PUT api/v1/users/:id', () => {
        test('400 BAD REQUEST: INVALID ID', async () => {
            const __ = await loginHelper("admin@test.com", process.env.TEST_PASSWORD, true)
            const notID = "a";
            const response = await request(server)
                .put(`/api/v1/users/${notID}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
        });

        test('400 BAD REQUEST: NO DATA TO UPDATE', async () => {
            const _ = await loginHelper("admin@test.com", process.env.TEST_PASSWORD, true)
            const __ = await loginHelper("user@test.com", process.env.TEST_PASSWORD, false)
            
            const updateWith = {}            
            
            const response = await request(server)
                .put(`/api/v1/users/${customerID}`)
                .set({ "x-access-token": `${adminToken}` })
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Bad request");
            expect(response.body.error.message).toEqual("No data to update");
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

        test('200 OK: UPDATED', async () => {
            const _ = await loginHelper("admin@test.com", process.env.TEST_PASSWORD, true)
            const __ = await loginHelper("user@test.com", process.env.TEST_PASSWORD, false)

            const updateWith = {
                firstName: "the new first name",
                lastName: "the new last name",
                adress: "the new adress",
                postcode: "the new postcode",
                city: "the new city",
                password: "Test123!", 
                role: "admin" // safety
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
            expect(response.body.data.phone).toEqual("012345678");
            expect(response.body.data.password).not.toBeDefined();
            expect(response.body.data.role).toEqual("customer");
        });

    });
});

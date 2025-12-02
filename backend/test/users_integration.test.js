process.env.NODE_ENV = 'test';

const request = require('supertest');
const server = require('./../app.js');
const jwt = require("jsonwebtoken");

let customerID = "";
let customerToken = "";
let adminID = "";
let adminToken = "";

describe('Users', () => {
    describe('POST /register', () => {
        /* test('201 OK CREATE', async () => {
            const response = await request(server)
                .post('/register')
                .send({ email: testEmail, password: testPwd })
                .expect(201);
            //console.log(response.body.data.message)
            expect(response.body.data.message).toEqual("User successfully registered.");
        });

        test('400 BAD REQUEST USER ALREADY EXISTS', async () => {
            const response = await request(server)
                .post('/register')
                .send({ email: testEmail, password: testPwd })
                .expect(400);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("User already exists");
        });

        test('401 UNAUTHORIZED NO EMAIL', async () => {
            const response = await request(server)
                .post('/register')
                .send({ password: testPwd })
                .expect(401);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Email or password missing");
        });

        test('401 UNAUTHORIZED NO PASSWORD', async () => {
            const response = await request(server)
                .post('/register')
                .send({ email: testEmail })
                .expect(401);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Email or password missing");
        }); */
    });


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
            const response = await request(server)
                .post('/api/v1/users/login')
                .send({ mail: "admin@test.com", password: process.env.TEST_PASSWORD});

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.type).toEqual("success");

            adminToken = response.body.data.token;
            expect(adminToken).toBeDefined();

            const decode = jwt.verify(adminToken, process.env.JWT_SECRET);
            expect(decode).toHaveProperty("mail", "admin@test.com");
            expect(decode).toHaveProperty("role", "admin");

            adminID = decode.id;
            expect(adminID).toBeDefined();
        });

        test('SUCCESS LOGIN: CUSTOMER', async () => {
            const response = await request(server)
                .post('/api/v1/users/login')
                .send({ mail: "user@test.com", password: process.env.TEST_PASSWORD});

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.type).toEqual("success");

            customerToken = response.body.data.token;
            expect(customerToken).toBeDefined();

            const decode = jwt.verify(customerToken, process.env.JWT_SECRET);
            expect(decode).toHaveProperty("mail", "user@test.com");
            expect(decode).toHaveProperty("role", "customer");

            customerID = decode.id;
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

            const validate = await request(server)
                .get('/api/v1/users/')
                .set({ "x-access-token": `${adminToken}` })
                .expect(200);

            expect(validate.body).toEqual(expect.any(Object));
            expect(validate.body.data.length).toEqual(3);

        });

    });
});

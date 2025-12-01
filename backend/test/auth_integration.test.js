process.env.NODE_ENV = 'test';

const request = require('supertest');
const server = require('./../app.js');
const jwt = require("jsonwebtoken");

let tempId = "";
let testToken = "";

describe('Auth', () => {
    
    
    
    
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

    describe('POST /login', () => {
        
        test('401 UNAUTHORIZED NO EMAIL', async () => {
            const response = await request(server)
                .post('/api/v1/users/login')
                .send({ password: process.env.TEST_PASSWORD })
                .expect(401);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Email or password missing");
        });       
        
        test('401 UNAUTHORIZED NO PASSWORD', async () => {
            const response = await request(server)
                .post('/api/v1/users/login')
                .send({ mail: "admin@test.com" })
                .expect(401);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Email or password missing");
        });

        test('401 UNAUTHORIZED WRONG EMAIL', async () => {
            const response = await request(server)
                .post('/api/v1/users/login')
                .send({ mail: "wrong@gmail.com", password: process.env.TEST_PASSWORD })
                .expect(401);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("User not found");
        }); 

        test('401 UNAUTHORIZED WRONG PASSWORD', async () => {
            const response = await request(server)
                .post('/api/v1/users/login')
                .send({ mail: "admin@test.com", password: "wrong"})
                .expect(401);

            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.error.title).toEqual("Wrong password");
        });
        
        test('SUCCESS LOGIN', async () => {
            const response = await request(server)
                .post('/api/v1/users/login')
                .send({ mail: "admin@test.com", password: process.env.TEST_PASSWORD});
            
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.data.type).toEqual("success");
            
            testToken = response.body.data.token;
            expect(testToken).toBeDefined();

            const decode = jwt.verify(testToken, process.env.JWT_SECRET);
            expect(decode).toHaveProperty("mail", "admin@test.com");
            expect(decode).toHaveProperty("role", "admin");

        });
    });
});
process.env.NODE_ENV = 'test';

const request = require('supertest');
const server = require('./../app.js');

describe('Rent', () => {
    describe('GET api/v1/', () => {
        test('200 OK: API RUNNING', async () => {

            const response = await request(server)
                .get(`/api/v1/`)
                .expect(200);
            
            expect(response.body).toEqual(expect.any(Object));
            expect(response.body.status).toEqual("V1 up and running");
            expect(response.body.time).toBeDefined();
        });
    });
});
"use strict"

const request = require('supertest');
const database = require("../database/database")
const jwt = require("jsonwebtoken");
const server = require('./../app.js');

async function loginHelper(mail, password, admin) {
    let token = ""
    let id = ""
    const response = await request(server)
        .post('/api/v1/users/login')
        .send({ mail: mail, password: password});

    if (response.body) {
        token = response.body.data.token;
        const decode = jwt.verify(token, process.env.JWT_SECRET);
        id = decode.id;
    }

    return { token, id };
}

async function getBike(num = 1) {
    const db = await database.getDb("bikes")
    const bike = await db.collection.findOne({ number: num});
    await db.client.close();
    return bike; 
}

module.exports = {
    loginHelper,
    getBike
}
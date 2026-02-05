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
    let db = await database.getDb("bikes"); 
    try {
        return await db.collection.findOne({ number: num});
    } finally {
        if (db && db.client) {
            await db.client.close();
        }
    }
}

module.exports = {
    loginHelper,
    getBike
}
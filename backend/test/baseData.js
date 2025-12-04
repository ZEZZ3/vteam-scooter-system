"use strict";

const database = require('../database/database');
const bcrypt = require('bcryptjs');

async function baseData() {
    const { collection, client } = await database.getDb("users");
    
    await collection.insertMany([
        {
            mail: "admin@test.com",
            password: await bcrypt.hash(process.env.TEST_PASSWORD, 10),
            role: "admin",
            phone: "123456789",
            verified: true,
            createdAt: new Date()
        },
        {
            mail: "user@test.com",
            password: await bcrypt.hash(process.env.TEST_PASSWORD, 10),
            role: "customer",
            phone: "012345678",
            verified: true,
            createdAt: new Date()
        }
    ]);
    await client.close();
}

module.exports = baseData;
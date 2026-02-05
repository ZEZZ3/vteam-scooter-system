"use strict";

const database = require('../database/database');

async function teardown() {
    const {db, client } = await database.getDb();
    await db.dropDatabase();
    await client.close();
}

module.exports = teardown;
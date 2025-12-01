"use strict";

const database = require('../database/database');

async function clearDatabase() {
    const {db, client } = await database.getDb();
    const collections = await db.collections();
    
    for (const c of collections) {
        await c.deleteMany({});
    }

    await client.close();
}

module.exports = clearDatabase;
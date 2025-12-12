"use strict";

const { MongoClient } = require('mongodb');

const database = {
    getDb: async function getDb(collectionName = "users") {

        //let dsn = `mongodb+srv://${process.env.ATLAS_USERNAME}:${process.env.ATLAS_PASSWORD}@cluster0.ilwcret.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
        let dsn = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dev";

        if (process.env.NODE_ENV === "test") {
            dsn = "mongodb://127.0.0.1:27017/test";
        }

        const client  = await MongoClient.connect(dsn, {});

        const db = await client.db();
        const collection = await db.collection(collectionName);

        if (collectionName === "users") {
            await collection.createIndex({mail: 1}, {unique: true});
        }

        return {
            db: db,
            collection: collection,
            client: client,
        };
    }
};

module.exports = database;

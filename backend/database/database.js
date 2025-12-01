"use strict";

const { MongoClient } = require('mongodb');

const database = {
    getDb: async function getDb(collectionName = "users") {
        
        //let dsn = `mongodb+srv://${process.env.ATLAS_USERNAME}:${process.env.ATLAS_PASSWORD}@cluster0.ilwcret.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
        //process.env.NODE_ENV = "test";

        if (process.env.NODE_ENV === "test") {
            dsn = "mongodb://127.0.0.1:27017/test";
        }

        const client  = await MongoClient.connect(dsn, {});

        const db = await client.db();
        const collection = await db.collection(collectionName);

        /*
        const count = await collection.countDocuments();
        if (count === 0) {
            await collection.insertMany(defaultData);
            console.log("Populating database");
        } */

        return {
            db: db,
            collection: collection,
            client: client,
        };
    }
};

module.exports = database;
const ObjectId = require('mongodb').ObjectId;
const database = require("../database/database.js");

const city = {

    /**
     * Get all cities
     */
    getAllCities: async function (res, req) {

        let db;

        try {
            db = await database.getDb("cities");
            const cities = await db.collection.find().toArray();

            return res.status(200).json({ data: cities });
        } catch (e) {
            return res.status(500).json({
                error: {
                    status: 500,
                    path: `GET api/v1/history/${userID}/payments/${paymentID}`,
                    title: "Database error",
                    message: e.message
                }
            });
        } finally {
            if (db && db.client) {
                await db.client.close();
            }
        }    
    },

};

module.exports = city;

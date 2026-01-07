const database = require("../database/database.js");

const service = {
    
    /**
     * Get all bikes
     */
    getAllBikes: async function (res, req) {

        let db;

        try {
            db = await database.getDb("bikes");
            const bikes = await db.collection.find({}).toArray();

            return res.status(200).json({ data: bikes });
        } catch (e) {
            return res.status(500).json({
                error: {
                    status: 500,
                    path: req.path,
                    title: "Database error",
                    message: e.message
                }
            })
        } finally {
            if (db && db.client) {
                await db.client.close();
            }
        }        
    },
};

module.exports = service;

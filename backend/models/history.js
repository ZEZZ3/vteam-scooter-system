const ObjectId = require('mongodb').ObjectId;
const database = require("../database/database.js");
const helpers = require("../utils/helpers.js");

const history = {
    getAllHistory: async function () {
        let result = {}

        let dbPayments = await database.getDb("payments");
        let dbRides = await database.getDb("rides");
        
        const payments = await dbPayments.collection.find().toArray();
        const rides = await dbRides.collection.find().toArray();
        
        result.payments = payments;
        result.rides = rides;
        
        await dbPayments.client.close();
        await dbRides.client.close();

        return result;
    },

    /**
     * Get history
     * filter with userID, type=payments or type=rides
     */
    getHistory: async function (res, req) {
        const isAdmin = req.user && req.user.role === "admin";
        const userID = req.query.userID;
        const type = req.query.type;

        let query = {};
        let result = {};
        let connections = [];

        try {

            if (isAdmin && (!userID && !type)) {
                result = await this.getAllHistory();
                return res.status(200).json({data: result});
            }

            // normal users are limited to only see their own data
            if (!isAdmin) {
                if (!userID) {
                    return res.status(400).json({
                        error: {
                            status: 400,
                            path: `GET api/v1/history/`,
                            title: "Bad request",
                            message: "Please provide userID field"
                        }
                    });                    
                }

                if (userID !== req.user.id) {
                    //  obscurity: 404 instead of 403
                    return res.status(404).json({
                        error: {
                            status: 404,
                            path: `GET api/v1/history/`,
                            title: "Not found",
                            message: "History not found"
                        }
                    });                       
                }
            }

            // admin can call without userID
            query = userID ? { _id: new ObjectId(userID) } : {}

            if(type === "rides" || !type) {
                const db = await database.getDb("rides");
                result.rides = await db.collection.find(query).toArray();
                connections.push(db);
            } 
            
            if (type === "payments" || !type) {
                const db = await database.getDb("payments");
                result.payments = await db.collection.find(query).toArray();
                connections.push(db);
            }

            return res.status(200).json({ data: result});
        } catch (e) {
            return res.status(500).json({
                error: {
                    status: 500,
                    path: "GET api/v1/bikes/",
                    title: "Database error",
                    message: e.message
                }
            })
        } finally {
            for(const db of connections) {
                if (db && db.client) {
                    await db.client.close()
                }
            }
        }        
    },

};

module.exports = history;

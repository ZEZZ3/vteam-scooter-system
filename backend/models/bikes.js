const ObjectId = require('mongodb').ObjectId;
const database = require("../database/database.js");
const helpers = require("../utils/helpers.js");

const bikes = {
    
    /**
     * Get all bikes
     */
    getBikes: async function (res, req) {
        const isAdmin = req.user && req.user.role === "admin";
        const rented = req.query.rented;
        const free = req.query.free;
        const city = req.query.city;

        let db;
        let query = {};

        try {
            db = await database.getDb("bikes");

            if (!isAdmin) {
                query.status = "free"
            } else {
                if (rented === "true" && free === "true") {

                } else if (rented === "true") {
                    query.status = "rented"
                } else if (free === "true" ) {
                    query.status = "free"
                }
            }
            if (city) {
                query.city = {$regex: city, $options: "i"};
            }

            const bikes = await db.collection.find(query).toArray();

            return res.status(200).json({ data: bikes });
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
            if (db && db.client) {
                await db.client.close();
            }
        }        
    },

    /**
     * Add a bike,
     * Requires:
     *  city
     *  currentZone
     *  currentStation
     *  position
     */
    addBike: async function (res, req) {

        const isAdmin = req.user && req.user.role === "admin";
        if (!isAdmin) {
            return res.status(403).json({
                error: {
                    status: 403,
                    path: "POST api/v1/bikes/",
                    title: "Forbidden",
                    message: "Action not allowed."
                }
            });
        }

        const city = req.body.city;
        const currentZone = req.body.currentZone;
        const currentStation = req.body.currentStation;
        const battery = 100;
        const position = req.body.position;
        
        if (!city || !currentZone || !currentStation || !position) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: "POST api/v1/bikes/",
                    title: "Bad request",
                    message: "Data field missing."
                }
            });
        }

        let dbBikes;
        let dbCity;

        try {
            dbBikes = await database.getDb("bikes");
            dbCity = await database.getDb("cities");

            const lastBike = await dbBikes.collection.findOne(
                {},
                {sort: {number: -1}, projection: {number: 1}}
            )
            const nextBikeNumber = (lastBike?.number || 0) + 1;

            const cityFetch = await dbCity.collection.findOne({name: city})
            if (!cityFetch) {
                return res.status(400).json({
                    error: {
                        status: 404,
                        path: "POST api/v1/bikes/",
                        title: "Not found",
                        message: `City with name '${city}' could not be found`
                    }
                });                
            }

            const cityID = cityFetch._id;

            await db.collection.insertOne({
                city,
                cityID,
                currentZone,
                currentStation,
                battery,
                position,
                status: "free",
                number: nextBikeNumber,
                createdAt: new Date()
            });

            return res.status(201).json({
                data: {
                    message: "Bike has been added."
                }
            });
        } catch (e) {
            return res.status(500).json({
                error: {
                    status: 500,
                    path: "GET api/v1/bikes/",
                    title: "Database error",
                    message: e.message
                }
            });
        } finally {
            if (dbBikes && dbBikes.client) {
                await dbBikes.client.close();
            }
            if (dbCity && dbCity.client) {
                await dbCity.client.close();
            }
        }        
    },

    getBikeByID: async function (res, req) {
        const isAdmin = req.user && req.user.role === "admin";
        const bikeID = req.params.bikeID;

        if (!ObjectId.isValid(bikeID)) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `GET api/v1/bikes/${bikeID}`,
                    title: "Bad request",
                    message: `Invalid ID: ${bikeID}`
                }
            });            
        }

        let db;

        try {
            db = await database.getDb("bikes");

            const bike = await db.collection.findOne({_id: new ObjectId(bikeID)});

            if (!bike || (!isAdmin && bike.status !== "free")) {
                return res.status(404).json({
                    error: {
                        status: 404,
                        path: `GET api/v1/bikes/${bikeID}`,
                        title: "Not found",
                        message: `Could not find bike with ID: ${bikeID}`
                    }
                });
            }

            return res.status(200).json({ data: bike });
        } catch (e) {
            return res.status(500).json({
                error: {
                    status: 500,
                    path: `GET api/v1/bikes/${bikeID}`,
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

    updateBikeByID : async function (res, req) {

        const isAdmin = req.user && req.user.role === "admin";
        const bikeID = req.params.bikeID;

        if (!ObjectId.isValid(bikeID)) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `PATCH api/v1/bikes/${bikeID}`,
                    title: "Bad request",
                    message: `Invalid ID: ${bikeID}`
                }
            });            
        }

        if (!isAdmin) {
            return res.status(403).json({
                error: {
                    status: 403,
                    path: `PATCH api/v1/bikes/${bikeID}`,
                    title: "Forbidden",
                    message: "Action not permitted."
                }
            });
        }

        let db;

        try {
            db = await database.getDb("bikes");

            const fields = [
                "city", 
                "currentZone", 
                "currentStation", 
                "battery", 
                "position"
            ];

            const newData = helpers.checkPatchData(req.body, fields);

            if(Object.keys(newData).length === 0) {
                return res.status(400).json({
                    error: {
                        status: 400,
                        path: `PATCH api/v1/bikes/${bikeID}`,
                        title: "Bad request",
                        message: "No data to update"
                    }
                });                
            }

            newData.updatedAt = new Date();

            const bike = await db.collection.findOneAndUpdate(
                {_id: new ObjectId(bikeID) },
                { $set: newData },
                { returnDocument: "after" }
            );

            if(!bike) {
                return res.status(404).json({
                    error: {
                        status: 404,
                        path: `PATCH api/v1/bikes/${bikeID}`,
                        title: "Not found",
                        message: `Bike with ID: ${bikeID} not found.`
                    }
                });                
            }

            return res.status(200).json({ data: bike });
        } catch (e) {
            return res.status(500).json({
                error: {
                    status: 500,
                    path: `PATCH api/v1/bikes/${bikeID}`,
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

    deleteBikeByID : async function (res, req) {

        const isAdmin = req.user && req.user.role === "admin";
        const bikeID = req.params.bikeID;

        if (!ObjectId.isValid(bikeID)) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `DELETE api/v1/bikes/${bikeID}`,
                    title: "Bad request",
                    message: `Invalid ID: ${bikeID}`
                }
            });
        }

        if (!isAdmin) {
            return res.status(403).json({
                error: {
                    status: 403,
                    path: `DELETE api/v1/bikes/${bikeID}`,
                    title: "Forbidden",
                    message: "Action not permitted."
                }
            });
        }

        let db;

        try {
            db = await database.getDb("bikes");

            const bike = await db.collection.deleteOne(
                { _id: new ObjectId(bikeID) }
            );

            if (bike.deletedCount === 0) {
                return res.status(404).json({
                    error: {
                        status: 404,
                        path: `DELETE api/v1/bikes/${bikeID}`,
                        title: "Not found",
                        message: `Bike with ID: '${bikeID}' not found.`
                    }
                });
            }

            return res.status(200).json({ data: { message: "Bike has been deleted" }});
        } catch (e) {
            return res.status(500).json({
                error: {
                    status: 500,
                    path: `DELETE api/v1/bikes/${bikeID}`,
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

module.exports = bikes;

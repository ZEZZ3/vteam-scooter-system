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
                    path: `GET api/v1/city/`,
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

    /**
     * Add city
     */
    addCity: async function (res, req) {

        const isAdmin = req.user && req.user.role === "admin";
        if (!isAdmin) {
            return res.status(403).json({
                error: {
                    status: 403,
                    path: "POST api/v1/city/",
                    title: "Forbidden",
                    message: "Action not allowed."
                }
            });
        }

        const name = req.body.name;
        
        if (!name) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: "POST api/v1/city/",
                    title: "Bad request",
                    message: "Name field is required."
                }
            });
        }

        let db;

        try {
            db = await database.getDb("cities");

            const exists = await db.collection.findOne({ name: name });
            if (exists) {
                return res.status(400).json({
                    error: {
                        status: 400,
                        path: "POST api/v1/city/",
                        title: "Bad request",
                        message: `City with name '${name}' already exists`
                    }
                });                
            }

            await db.collection.insertOne({
                name,
                zones: [],
                stations: [],
                createdAt: new Date(),
            });

            return res.status(201).json({
                data: {
                    message: "City has been added."
                }
            });
        } catch (e) {
            return res.status(500).json({
                error: {
                    status: 500,
                    path: "POST api/v1/city/",
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

    /**
     * Get specific city
     */
    getCityByID: async function (res, req) {
        const cityID = req.params.cityID;
        
        if (!ObjectId.isValid(cityID)) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `GET api/v1/city/${cityID}`,
                    title: "Bad request",
                    message: `Invalid ID: ${cityID}`
                }
            });            
        }

        let db;

        try {
            db = await database.getDb("cities");
            
            const city = await db.collection.findOne({_id: new ObjectId(cityID)});
            
            if (!city) {
                return res.status(404).json({
                    error: {
                        status: 404,
                        path: `GET api/v1/city/${cityID}`,
                        title: "Not found",
                        message: `City with id '${cityID}' not found`
                    }
                });                
            }

            return res.status(200).json({
                data: {
                    city
                }
            });
        } catch (e) {
            return res.status(500).json({
                error: {
                    status: 500,
                    path: "GET api/v1/city/",
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

    /**
     * Update a city (PATCH)
     */
    /*updateCity : async function (res, req) {

        const isAdmin = req.user && req.user.role === "admin";
        const cityID = req.params.cityID;

        if (!ObjectId.isValid(cityID)) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `PATCH api/v1/city/${cityID}`,
                    title: "Bad request",
                    message: `Invalid ID: ${cityID}`
                }
            });            
        }

        if (!isAdmin) {
            return res.status(403).json({
                error: {
                    status: 403,
                    path: `PATCH api/v1/city/${cityID}`,
                    title: "Forbidden",
                    message: "Action not permitted."
                }
            });
        }

        let db;

        try {
            db = await database.getDb("cities");

            const fields = [
                "name",
                "zones", 
                "stations",
            ];

            const newData = helpers.checkPatchData(req.body, fields);

            if(Object.keys(newData).length === 0) {
                return res.status(400).json({
                    error: {
                        status: 400,
                        path: `PATCH api/v1/city/${cityID}`,
                        title: "Bad request",
                        message: "No data to update"
                    }
                });                
            }

            newData.updatedAt = new Date();

            const city = await db.collection.findOneAndUpdate(
                {_id: new ObjectId(cityID) },
                { $set: newData },
                { returnDocument: "after" }
            );

            if(!city) {
                return res.status(404).json({
                    error: {
                        status: 404,
                        path: `PATCH api/v1/city/${cityID}`,
                        title: "Not found",
                        message: `City with ID: ${cityID} not found.`
                    }
                });                
            }

            return res.status(200).json({ data: city });
        } catch (e) {
            return res.status(500).json({
                error: {
                    status: 500,
                    path: `PATCH api/v1/city/${cityID}`,
                    title: "Database error",
                    message: e.message
                }
            });
        } finally {
            if (db && db.client) {
                await db.client.close();
            }
        }        
    }, */

    deleteCity : async function (res, req) {

        const isAdmin = req.user && req.user.role === "admin";
        const cityID = req.params.cityID;

        if (!ObjectId.isValid(cityID)) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `DELETE api/v1/city/${cityID}`,
                    title: "Bad request",
                    message: `Invalid ID: ${cityID}`
                }
            });
        }

        if (!isAdmin) {
            return res.status(403).json({
                error: {
                    status: 403,
                    path: `DELETE api/v1/city/${cityID}`,
                    title: "Forbidden",
                    message: "Action not permitted."
                }
            });
        }

        let db;

        try {
            db = await database.getDb("cities");

            const city = await db.collection.deleteOne(
                { _id: new ObjectId(cityID) }
            );

            if (city.deletedCount === 0) {
                return res.status(404).json({
                    error: {
                        status: 404,
                        path: `DELETE api/v1/city/${cityID}`,
                        title: "Not found",
                        message: `City with ID: '${cityID}' not found.`
                    }
                });
            }

            return res.status(200).json({ data: { message: "City has been deleted" }});
        } catch (e) {
            return res.status(500).json({
                error: {
                    status: 500,
                    path: `DELETE api/v1/city/${cityID}`,
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

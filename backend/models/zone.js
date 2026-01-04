const ObjectId = require('mongodb').ObjectId;
const database = require("../database/database.js");
const helpers = require("../utils/helpers.js");

const zone = {

    /**
     * Get all zones
     */
    getAllZones : async function (res, req) {
        
        let dbZones;

        try {
            dbZones = await database.getDb("zones");
            const zones = await dbZones.collection
                .find()
                .toArray();

            return res.status(200).json({ data: zones });
        } catch (e) {
            return res.status(500).json({
                error: {
                    status: 500,
                    path: `GET api/v1/zone`,
                    title: "Database error",
                    message: e.message
                }
            });
        } finally {
            if (dbZones && dbZones.client) {
                await dbZones.client.close();
            }
        }
    },

    /**
     * Add a zone to a city
     */
    addZone : async function (res, req) {
        const isAdmin = req.user && req.user.role === "admin";
        const cityID = req.body.cityID
        
        if (!cityID) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `POST api/v1/zone`,
                    title: "Bad request",
                    message: "City ID is required"
                }
            });
        }

        if (!ObjectId.isValid(cityID)) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `GET api/v1/zone`,
                    title: "Bad request",
                    message: `Invalid ID: ${cityID}`
                }
            });
        }
        
        if (!isAdmin) {
            return res.status(403).json({
                error: {
                    status: 403,
                    path: `POST api/v1/zone`,
                    title: "Forbidden",
                    message: "Action not allowed."
                }
            });
        }

        const name = req.body.name;
        const area = req.body.area;

        if (!name) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `POST api/v1/zone`,
                    title: "Bad request",
                    message: "Name field is required."
                }
            });
        }

        if (!area || !area.coordinates) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `POST api/v1/zone`,
                    title: "Bad request",
                    message: "Area coordinate field is required."
                }
            });
        }

        let dbZones;
        let dbCities;

        try {
            dbZones = await database.getDb("zones");
            dbCities = await database.getDb("cities");

            const cityExists = await dbCities.collection.findOne({ _id: new ObjectId(cityID) });
            if(!cityExists) {
                return res.status(404).json({
                    error: {
                        status: 404,
                        path: `POST api/v1/zone`,
                        title: "Not found",
                        message: `City with ID: ${cityID} not found.`
                    }
                });
            }

            const zoneExists = await dbZones.collection.findOne({ name: name, cityID: new ObjectId(cityID) });
            if (zoneExists) {
                return res.status(400).json({
                    error: {
                        status: 400,
                        path: `POST api/v1/zone`,
                        title: "Bad request",
                        message: `Zone with name '${name}' already exists in this city`
                    }
                });                
            }

            const insert = await dbZones.collection.insertOne({
                cityID: new ObjectId(cityID),
                name: name.trim(),
                area: area,
                createdAt: new Date()
            });

            const zoneID = insert.insertedId

            await dbCities.collection.findOneAndUpdate(
                { _id: new ObjectId(cityID) },
                { $push: { zones: zoneID }}
            );

            return res.status(201).json({
                data: {
                    message: "Zone has been added."
                }
            });
        } catch (e) {
            return res.status(500).json({
                error: {
                    status: 500,
                    path: "POST api/v1/zone",
                    title: "Database error",
                    message: e.message
                }
            });
        } finally {
            if (dbZones && dbZones.client) {
                await dbZones.client.close();
            }
            if (dbCities && dbCities.client) {
                await dbCities.client.close();
            }
        }   
    },

    /**
     * Get a zone by id
     */
    getZoneByID : async function (res, req) {
        
        const zoneID = req.params.zoneID;

        if (!ObjectId.isValid(zoneID)) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `GET api/v1/zone/${zoneID}`,
                    title: "Bad request",
                    message: `Invalid zone ID: ${zoneID}`
                }
            });            
        }

        let dbZones;

        try {
            dbZones = await database.getDb("zones");

            const zone = await dbZones.collection.findOne({ _id: new ObjectId(zoneID) });
            if (!zone) {
                return res.status(404).json({
                    error: {
                        status: 404,
                        path: `GET api/v1/zone/${zoneID}`,
                        title: "Not found",
                        message: `Zone with ID: ${zoneID} not found.`
                    }
                });
            }

            return res.status(200).json({
                data: {
                    zone
                }
            });
        } catch (e) {
            return res.status(500).json({
                error: {
                    status: 500,
                    path: `GET api/v1/zone/${zoneID}`,
                    title: "Database error",
                    message: e.message
                }
            });
        } finally {
            if (dbZones && dbZones.client) {
                await dbZones.client.close();
            }
        }  
    },

    /**
     * Update a zone by id
     */
    updateZone : async function (res, req) {

        const isAdmin = req.user && req.user.role === "admin";
        const zoneID = req.params.zoneID;

        if (!ObjectId.isValid(zoneID)) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `PATCH api/v1/zone/${zoneID}`,
                    title: "Bad request",
                    message: `Invalid zone ID: ${zoneID}`
                }
            });            
        }

        if (!isAdmin) {
            return res.status(403).json({
                error: {
                    status: 403,
                    path: `PATCH api/v1/zone/${zoneID}`,
                    title: "Forbidden",
                    message: "Action not permitted."
                }
            });
        }

        let dbZones;

        try {
            dbZones = await database.getDb("zones");

            const fields = [
                "name",
                "area" 
            ];

            const newData = helpers.checkPatchData(req.body, fields);

            if(Object.keys(newData).length === 0) {
                return res.status(400).json({
                    error: {
                        status: 400,
                        path: `PATCH api/v1/zone/${zoneID}`,
                        title: "Bad request",
                        message: "No data to update"
                    }
                });                
            }

            newData.updatedAt = new Date();

            const zone = await dbZones.collection.findOneAndUpdate(
                {_id: new ObjectId(zoneID) },
                { $set: newData },
                { returnDocument: "after" }
            );

            if(!zone) {
                return res.status(404).json({
                    error: {
                        status: 404,
                        path: `PATCH api/v1/zone/${zoneID}`,
                        title: "Not found",
                        message: `Zone with ID: ${zoneID} not found.`
                    }
                });                
            }

            return res.status(200).json({ data: zone });
        } catch (e) {
            return res.status(500).json({
                error: {
                    status: 500,
                    path: `PATCH api/v1/zone/${zoneID}`,
                    title: "Database error",
                    message: e.message
                }
            });
        } finally {
            if (dbZones && dbZones.client) {
                await dbZones.client.close();
            }
        }    
    },

    /**
     * Delete a zone in a city by id
     */
    deleteZone : async function (res, req) {

        const isAdmin = req.user && req.user.role === "admin";
        const zoneID = req.params.zoneID;

        if (!isAdmin) {
            return res.status(403).json({
                error: {
                    status: 403,
                    path: `DELETE api/v1/zone/${zoneID}`,
                    title: "Forbidden",
                    message: "Action not permitted."
                }
            });
        }

        if (!ObjectId.isValid(zoneID)) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `DELETE api/v1/zone/${zoneID}`,
                    title: "Bad request",
                    message: `Invalid ID: ${zoneID}`
                }
            });
        }

        let dbZones;
        let dbCities;

        try {
            dbZones = await database.getDb("zones");
            dbCities = await database.getDb("cities");

            const zone = await dbZones.collection.findOne(
                { _id: new ObjectId(zoneID) }
            );

            if (!zone) {
                return res.status(404).json({
                    error: {
                        status: 404,
                        path: `DELETE api/v1/zone/${zoneID}`,
                        title: "Not found",
                        message: `Zone with ID: '${zoneID}' not found.`
                    }
                });
            }

            await dbZones.collection.deleteOne(
                { _id: new ObjectId(zoneID) }
            );

            const cityID = zone.cityID;

            await dbCities.collection.findOneAndUpdate(
                { _id: new ObjectId(cityID) },
                { $pull: { zones: new ObjectId(zoneID) } }
            );

            return res.status(200).json({ data: { message: "Zone has been deleted" }});
        } catch (e) {

            return res.status(500).json({
                error: {
                    status: 500,
                    path: `DELETE api/v1/zone/${zoneID}`,
                    title: "Database error",
                    message: e.message
                }
            });
        } finally {
            if (dbZones && dbZones.client) {
                await dbZones.client.close();
            }
            if (dbCities && dbCities.client) {
                await dbCities.client.close();
            }
        }
    },
};

module.exports = zone;

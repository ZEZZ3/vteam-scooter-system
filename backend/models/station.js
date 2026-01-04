const ObjectId = require('mongodb').ObjectId;
const database = require("../database/database.js");
const helpers = require("../utils/helpers.js");

const station = {

    /**
     * Get all stations in a city
     */
    getAllStations : async function (res, req) {
        
        let dbStations;

        try {
            dbStations = await database.getDb("stations");
            const stations = await dbStations.collection
                .find()
                .toArray();

            return res.status(200).json({ data: stations });
        } catch (e) {
            return res.status(500).json({
                error: {
                    status: 500,
                    path: `GET api/v1/station`,
                    title: "Database error",
                    message: e.message
                }
            });
        } finally {
            if (dbStations && dbStations.client) {
                await dbStations.client.close();
            }
        }
    },

    /**
     * Add station
     */
    addStation : async function (res, req) {
        const isAdmin = req.user && req.user.role === "admin";
        const cityID = req.body.cityID
        const zoneID = req.body.zoneID
        
        if (!isAdmin) {
            return res.status(403).json({
                error: {
                    status: 403,
                    path: `POST api/v1/station`,
                    title: "Forbidden",
                    message: "Action not allowed."
                }
            });
        }

        if (!cityID) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `POST api/v1/station`,
                    title: "Bad request",
                    message: "City ID is required"
                }
            });
        }

        if (!zoneID) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `POST api/v1/station`,
                    title: "Bad request",
                    message: "Zone ID is required"
                }
            });
        }

        if (!ObjectId.isValid(cityID)) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `GET api/v1/zone`,
                    title: "Bad request",
                    message: `Invalid city ID: ${cityID}`
                }
            });
        }

        if (!ObjectId.isValid(zoneID)) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `GET api/v1/zone`,
                    title: "Bad request",
                    message: `Invalid zone ID: ${zoneID}`
                }
            });
        }

        const name = req.body.name;
        const position = req.body.position;

        if (!name) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `POST api/v1/station`,
                    title: "Bad request",
                    message: "Name field is required."
                }
            });
        }

        if (!position) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `POST api/v1/zone`,
                    title: "Bad request",
                    message: "Position field is required."
                }
            });
        }

        let dbStations;
        let dbCities;
        let dbZones;

        try {
            dbStations = await database.getDb("stations");
            dbCities = await database.getDb("cities");
            dbZones = await database.getDb("zones");

            const cityExists = await dbCities.collection.findOne({ _id: new ObjectId(cityID) });
            if(!cityExists) {
                return res.status(404).json({
                    error: {
                        status: 404,
                        path: `POST api/v1/station`,
                        title: "Not found",
                        message: `City with ID: ${cityID} not found.`
                    }
                });
            }

            const zoneExists = await dbZones.collection.findOne({ _id: new ObjectId(zoneID) });
            if (!zoneExists) {
                return res.status(404).json({
                    error: {
                        status: 404,
                        path: `POST api/v1/station`,
                        title: "Not found",
                        message: `Zone with ID: ${zoneID} not found.`
                    }
                });                
            }

            const stationExists = await dbStations.collection.findOne({ name: name, cityID: new ObjectId(cityID), zoneID: zoneID });
            if (stationExists) {
                return res.status(400).json({
                    error: {
                        status: 400,
                        path: `POST api/v1/station`,
                        title: "Bad request",
                        message: `Station with name '${name}' already exists in this city and zone`
                    }
                });                
            }
            

            const insert = await dbStations.collection.insertOne({
                cityID: new ObjectId(cityID),
                name: name.trim(),
                zoneID: zoneID,
                position: position,
                createdAt: new Date()
            });

            const stationID = insert.insertedId

            await dbCities.collection.findOneAndUpdate(
                { _id: new ObjectId(cityID) },
                { $push: { stations: stationID }}
            );

            return res.status(201).json({
                data: {
                    message: "Station has been added."
                }
            });
        } catch (e) {
            return res.status(500).json({
                error: {
                    status: 500,
                    path: "POST api/v1/station",
                    title: "Database error",
                    message: e.message
                }
            });
        } finally {
            if (dbStations && dbStations.client) {
                await dbStations.client.close();
            }
            if (dbCities && dbCities.client) {
                await dbCities.client.close();
            }
            if (dbZones && dbZones.client) {
                await dbZones.client.close();
            }
        }   
    },

    /**
     * Get station in a city by id
     */
    getStationByID : async function (res, req) {
        
        const stationID = req.params.stationID;

        if (!ObjectId.isValid(stationID)) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `GET api/v1/station/${stationID}`,
                    title: "Bad request",
                    message: `Invalid station ID: ${stationID}`
                }
            });            
        }

        let dbStations;

        try {
            dbStations = await database.getDb("stations");

            const station = await dbStations.collection.findOne({ _id: new ObjectId(stationID) });
            if (!station) {
                return res.status(404).json({
                    error: {
                        status: 404,
                        path: `GET api/v1/station/${stationID}`,
                        title: "Not found",
                        message: `Station with ID: ${stationID} not found.`
                    }
                });
            }

            return res.status(200).json({
                data: {
                    station
                }
            });
        } catch (e) {
            return res.status(500).json({
                error: {
                    status: 500,
                    path: `GET api/v1/station/${stationID}`,
                    title: "Database error",
                    message: e.message
                }
            });
        } finally {
            if (dbStations && dbStations.client) {
                await dbStations.client.close();
            }
        }      
    },

    /**
     * Update a station by id
     */
    updateStation : async function (res, req) {

        const isAdmin = req.user && req.user.role === "admin";
        const stationID = req.params.stationID;

        if (!isAdmin) {
            return res.status(403).json({
                error: {
                    status: 403,
                    path: `PATCH api/v1/station/${stationID}`,
                    title: "Forbidden",
                    message: "Action not permitted."
                }
            });
        }

        if (!ObjectId.isValid(stationID)) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `PATCH api/v1/station/${zoneID}`,
                    title: "Bad request",
                    message: `Invalid station ID: ${stationID}`
                }
            });            
        }

        let dbStations;

        try {
            dbStations = await database.getDb("stations");

            const fields = [
                "name",
                "position",
                "zoneID"
            ];

            const newData = helpers.checkPatchData(req.body, fields);

            if(Object.keys(newData).length === 0) {
                return res.status(400).json({
                    error: {
                        status: 400,
                        path: `PATCH api/v1/station/${stationID}`,
                        title: "Bad request",
                        message: "No data to update"
                    }
                });                
            }

            newData.updatedAt = new Date();

            const station = await dbStations.collection.findOneAndUpdate(
                {_id: new ObjectId(stationID) },
                { $set: newData },
                { returnDocument: "after" }
            );

            if(!station) {
                return res.status(404).json({
                    error: {
                        status: 404,
                        path: `PATCH api/v1/station/${stationID}`,
                        title: "Not found",
                        message: `Station with ID: ${stationID} not found.`
                    }
                });
            }

            return res.status(200).json({ data: station });
        } catch (e) {
            console.log(e.stack)
            return res.status(500).json({
                error: {
                    status: 500,
                    path: `PATCH api/v1/station/${stationID}`,
                    title: "Database error",
                    message: e.message
                }
            });
        } finally {
            if (dbStations && dbStations.client) {
                await dbStations.client.close();
            }
        }
    },

    /**
     * Delete a station by id
     */
    deleteStation : async function (res, req) {

        const isAdmin = req.user && req.user.role === "admin";
        const stationID = req.params.stationID;

        if (!isAdmin) {
            return res.status(403).json({
                error: {
                    status: 403,
                    path: `DELETE api/v1/station/${stationID}`,
                    title: "Forbidden",
                    message: "Action not permitted."
                }
            });
        }

        if (!ObjectId.isValid(stationID)) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `DELETE api/v1/station/${stationID}`,
                    title: "Bad request",
                    message: `Invalid ID: ${stationID}`
                }
            });
        }

        let dbStations;
        let dbCities;

        try {
            dbStations = await database.getDb("stations");
            dbCities = await database.getDb("cities");

            const station = await dbStations.collection.findOne(
                { _id: new ObjectId(stationID) }
            );

            if (!station) {
                return res.status(404).json({
                    error: {
                        status: 404,
                        path: `DELETE api/v1/station/${stationID}`,
                        title: "Not found",
                        message: `Station with ID: '${stationID}' not found.`
                    }
                });
            }

            await dbStations.collection.deleteOne(
                { _id: new ObjectId(stationID) }
            );

            const cityID = station.cityID;

            await dbStations.collection.findOneAndUpdate(
                { _id: new ObjectId(cityID) },
                { $pull: { stations: new ObjectId(stationID) } }
            );

            return res.status(200).json({ data: { message: "Station has been deleted" }});
        } catch (e) {

            return res.status(500).json({
                error: {
                    status: 500,
                    path: `DELETE api/v1/station/${stationID}`,
                    title: "Database error",
                    message: e.message
                }
            });
        } finally {
            if (dbStations && dbStations.client) {
                await dbStations.client.close();
            }
            if (dbCities && dbCities.client) {
                await dbCities.client.close();
            }
        }    
    },

};

module.exports = station;

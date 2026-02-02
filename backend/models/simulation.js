const ObjectId = require('mongodb').ObjectId;
const database = require("../database/database.js");

const simulation = {

    /**
     * Get all simulations
     */
    getAllSimulations: async function (res, req) {

        let db;

        try {
            db = await database.getDb("simulations");
            const simulations = await db.collection.find().toArray();

            return res.status(200).json({ data: simulations });
        } catch (e) {
            return res.status(500).json({
                error: {
                    status: 500,
                    path: `GET api/v1/simulation/`,
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
     * Get simulation by ID
     */
    getSimulationByID: async function (res, req) {
        const simulationID = req.params.simulationID;
        
        if (!ObjectId.isValid(simulationID)) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `GET api/v1/simulation/${simulationID}`,
                    title: "Bad request",
                    message: `Invalid ID: ${simulationID}`
                }
            });            
        }

        let db;

        try {
            db = await database.getDb("simulations");
            
            const simulation = await db.collection.findOne({_id: new ObjectId(simulationID)});
            
            if (!simulation) {
                return res.status(404).json({
                    error: {
                        status: 404,
                        path: `GET api/v1/simulation/${simulationID}`,
                        title: "Not found",
                        message: `Simulation with id '${simulationID}' not found`
                    }
                });                
            }

            return res.status(200).json({
                data: {
                    simulation
                }
            });
        } catch (e) {
            return res.status(500).json({
                error: {
                    status: 500,
                    path: `GET api/v1/simulation/${simulationID}`,
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
     * Create a simulation entry in database
     */
    createSimulation: async function (res, req) {

        const ticks = req.body.ticks;
        const totalBikes = req.body.totalBikes;
        const finishedBikes = req.body.finishedBikes;
        const finishedAt = req.body.finishedAt;
        const configuration = req.body.configuration;

        if (!ticks || !totalBikes || !finishedBikes || !finishedAt || !configuration) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: "POST api/v1/simulation/",
                    title: "Bad request",
                    message: "Missing required field"
                }
            });
        }

        let db;

        try {
            db = await database.getDb("simulations");

            await db.collection.insertOne({
                ticks,
                totalBikes,
                finishedBikes,
                finishedAt,
                configuration,
                createdAt: new Date(),
            });

            return res.status(201).json({
                data: {
                    message: "Simulation added."
                }
            });
        } catch (e) {
            return res.status(500).json({
                error: {
                    status: 500,
                    path: "POST api/v1/simulation/",
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
     * Delete simulation by ID
     */
    deleteSimulation: async function (res, req) {
        const simulationID = req.params.simulationID;
        
        if (!ObjectId.isValid(simulationID)) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `DELETE api/v1/simulation/${simulationID}`,
                    title: "Bad request",
                    message: `Invalid ID: ${simulationID}`
                }
            });            
        }

        let db;

        try {
            db = await database.getDb("simulations");
            
            const simulation = await db.collection.findOne({_id: new ObjectId(simulationID)});
            
            if (!simulation) {
                return res.status(404).json({
                    error: {
                        status: 404,
                        path: `DELETE api/v1/simulation/${simulationID}`,
                        title: "Not found",
                        message: `Simulation with id '${simulationID}' not found`
                    }
                });                
            }

            await db.collection.deleteOne(
                { _id: new ObjectId(simulationID) }
            );

            return res.status(200).json({ data: { message: "Simulation has been deleted" }});

        } catch (e) {
            return res.status(500).json({
                error: {
                    status: 500,
                    path: `DELETE api/v1/simulation/${simulationID}`,
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

}

module.exports = simulation;

const ObjectId = require('mongodb').ObjectId;
const database = require("../database/database.js");
const helpers = require("../utils/helpers.js");

const users = {

    /**
     * Show the status of a specific bike.
     */
    getRentStatus: async function (res, req) {
        const bikeID = req.body.bikeID;

        if (!bikeID) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `GET api/v1/rent/${bikeID}`,
                    title: "Bad Request",
                    message: "Bike ID is missing"
                }
            });
        }

        let db;

        try {
            db = await database.getDb("bikes");

            const bike = await db.collection.findOne({_id: new ObjectId(bikeID)});

            if (!bike) {
                return res.status(404).json({
                    error: {
                        status: 404,
                        path: `GET api/v1/rent/${bikeID}`,
                        title: "Not found",
                        message: `Bike with ID: ${bikeID} could not be found`
                    }
                });
            }

            return res.status(200).json({ data: bike.status });
        } catch (e) {
            return res.status(500).json({
                errors: {
                    status: 500,
                    path: `GET api/v1/rent/${bikeID}`,
                    title: "Database error",
                    message: e.message
                }
            });
        } finally {
            await db.client.close();
        }
    },


    validateBike: async function (bikeID) {
        let dbBikes;
        try {

            dbBikes = await database.getDb("bikes");
            
            const bike = await dbBikes.collection.findOne({_id: new ObjectId(bikeID)});
            
            if (!bike) {
                return {
                    error: {
                        status: 404,
                        path: `POST api/v1/rent/${bikeID}`,
                        title: "Not found",
                        message: `Bike with ID: ${bikeID} could not be found`
                    }
                }
            }
            
            if (bike.status === "rented") {
                return {
                    error: {
                        status: 409,
                        path: `POST api/v1/rent/${bikeID}`,
                        title: "Conflict",
                        message: `Bike with ID: ${bikeID} is busy and cant be rented.`
                    }
                }
            }               
            
            return bike
        } finally {
            if (dbBikes) {
                await dbBikes.client.close();
            }
        }
    },

    validateRide: async function(user, bikeID) {
        let dbRides = await database.getDb("rides");

        try {

            const activeRide = await dbRides.collection.findOne({bike: new ObjectId(bikeID), status: "active"});
            
            // trying to rent an active bike
            if (activeRide) {
                return {
                    error: {
                        status: 409,
                        path: `POST api/v1/rent/${bikeID}`,
                        title: "Conflict",
                        message: `Bike with ID: ${bikeID} is busy and cant be rented.`
                    }
                }               
            }
            
            // only user who started the ride or an admin can make changes
            /*
            if (!user.role !== "admin" && activeRide.user !== user.id) {
                return {
                    error: {
                        status: 403,
                        path: `POST api/v1/rent/${bikeID}`,
                        title: "Forbidden",
                        message: "You are not allowed to make changes to this ride"
                    }
                }        
            } */
            
            return activeRide
        } finally {
            if (dbRides) {
                await dbRides.client.close();
            }
        }
    },

    updateBike: async function(bikeID) {
        let dbBikes = await database.getDb("bikes");
        
        try {

            const updateBike = await dbBikes.collection.findOneAndUpdate(
                { _id: new ObjectId(bikeID) },
                { $set: { status: "rented" } },
                { returnDocument: "after" }
            );

            if (!updateBike) {
                return {
                    error: {
                        status: 404,
                        path: `POST api/v1/rent/rent/${bikeID}`,
                        title: "Not found",
                        message: `Could not update bike's status. BikeID: ${bikeID}`
                    }
                }                
            }
            
            return updateBike
        } finally {
            await dbBikes.client.close();
        }
    },
        
    validateUser: async function(userID, bikeID) {
        let dbUser = await database.getDb("users");
        
        try {

            const user = await dbUser.collection.findOne({_id: new ObjectId(userID)});
            if (!user) {
                return {
                    error: {
                        status: 404,
                        path: `POST api/v1/rent/rent/${bikeID}`,
                        title: "Not found",
                        message: `Could not find User with ID: ${req.user.id}`
                    }
                }                
            }
            
            if (user.balance < helpers.minBalance) {
                return {
                    error: {
                        status: 402,
                        path: `POST api/v1/rent/rent/${bikeID}`,
                        title: "Insufficient balance",
                        message: "Users balance is too low to start a ride."
                    }
                }                   
            }
            
            return user
        } finally {
            await dbUser.client.close();
        }
    },

    createRide: async function(bikeID, userID, bikePos) {
        let dbRides = await database.getDb("rides");

        try {

            const createRide = await dbRides.collection.insertOne({
                user: new ObjectId(userID),
                bike: new ObjectId(bikeID),
                start: new Date(),
                stop: null,
                startPos: bikePos,
                stopPos: null,
                duration: null,
                price: null,
                parking: null,
                active: true
            });
            
            if (!createRide || !createRide.insertedId) {
                return res.status(500).json({
                    error: {
                        status: 500,
                        path: `POST api/v1/rent/start/${bikeID}`,
                        title: "Could not create ride",
                        message: "There was a problem creating the ride."
                    }
                });                
            }
            
            return createRide.insertedId;

        } finally {
            await dbRides.client.close();
        }
    },

    startRide: async function (res, req) {
        const bikeID = req.body.bikeID;
        
        if (!bikeID) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `POST api/v1/rent/start/${bikeID}`,
                    title: "Bad Request",
                    message: "Bike ID is missing"
                }
            });
        }

        try {
            let validateRes;

            validateRes = await this.validateBike(bikeID);
            if (validateRes.error) {
                return res.status(validateRes.error.status).json(validateRes.error);
            }

            validateRes = await this.validateRide(req.user)
            if (validateRes.error) {
                return res.status(validateRes.error.status).json(validateRes.error);
            }

            validateRes = await this.updateBike(bikeID)
            if (validateRes.error) {
                return res.status(validateRes.error.status).json(validateRes.error);
            }
            const bikePos = validateRes.position;

            validateRes = await this.validateUser(req.user.id, bikeID)
            if (validateRes.error) {
                return res.status(validateRes.error.status).json(validateRes.error);
            }
            
            validateRes = await this.createRide(bikeID, req.user.id, bikePos)
            if (validateRes.error) {
                return res.status(validateRes.error.status).json(validateRes.error);
            }

            return res.status(201).json({
                 data: {
                    message: "Bike has been rented",
                    bikeID: bikeID,
                    userID: req.user.id,
                    rideID: validateRes
                 }
            });
        } catch (e) {
            return res.status(500).json({
                errors: {
                    status: 500,
                    path: `POST api/v1/rent/${bikeID}`,
                    title: "Database error",
                    message: e.message
                }
            });
        } 
    },

    stopRide: async function (res, req) {
        const bikeID = req.body.bikeID;
        
        if (!bikeID) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `POST api/v1/rent/stop/${bikeID}`,
                    title: "Bad Request",
                    message: "Bike ID is missing"
                }
            });
        }

    },

    /**
     * An admin can list all users.
     */
    changeStatus: async function (res, req) {
        const changeTo = req.body.changeTo;
        const bikeID = req.body.bikeID;

        if (!bikeID) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `POST api/v1/rent/${bikeID}`,
                    title: "Bad Request",
                    message: "Bike ID is missing"
                }
            });
        }

        if (!changeTo) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `POST api/v1/rent/${bikeID}`,
                    title: "Bad Request",
                    message: "changeTo field is missing"
                }
            });
        }

        if (!helpers.changeToIsValid(changeTo)) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `POST api/v1/rent/${bikeID}`,
                    title: "Bad Request",
                    message: "changeTo field is not a valid option"
                }
            });
        }

        let dbBikes;
        let dbRides;

        try {
            dbBikes = await database.getDb("bikes");
            dbRides = await database.getDb("rides");
            
            const bike = await dbBikes.collection.findOne({_id: new ObjectId(bikeID)});
            
            if (!bike) {
                return res.status(404).json({
                    error: {
                        status: 404,
                        path: `POST api/v1/rent/${bikeID}`,
                        title: "Not found",
                        message: `Bike with ID: ${bikeID} could not be found`
                    }
                });
            }

            // trying to rent an active bike
            if (bike.status === "rented" && changeTo === "rented") {
                return res.status(409).json({
                    error: {
                        status: 409,
                        path: `POST api/v1/rent/${bikeID}`,
                        title: "Conflict",
                        message: `Bike with ID: ${bikeID} is busy and cant be rented.`
                    }
                });                
            }

            const ride = await dbRides.collection.findOne({bike: new ObjectId(bikeID), status: "active"});

            // only user who started the ride or an admin can make changes
            if (!req.user.role !== "admin" && ride.user !== req.user.id) {
                return res.status(403).json({
                    error: {
                        status: 403,
                        path: `POST api/v1/rent/${bikeID}`,
                        title: "Forbidden",
                        message: "You are not allowed to make changes to this ride"
                    }
                });                   
            }

            // trying to rent an active bike
            if (ride && changeTo === "rented") {
                return res.status(409).json({
                    error: {
                        status: 409,
                        path: `POST api/v1/rent/${bikeID}`,
                        title: "Conflict",
                        message: `Bike with ID: ${bikeID} is busy and cant be rented.`
                    }
                });                
            }

            const update = await dbBikes.collection.findOneAndUpdate(
                { _id: new ObjectId(bikeID) },
                { $set: { status: changeTo } },
                { returnDocument: "after" }
            );

            if (!update) {
                return res.status(500).json({
                    error: {
                        status: 500,
                        path: `POST api/v1/rent/${bikeID}`,
                        title: "Could not verify user",
                        message: "There was a problem verifying the user."
                    }
                });                
            }

            return res.status(200).json({
                 data: {
                    message: "Bike status updated",
                    bike: {
                        status: changeTo,
                        id: bike._id
                    }
                 }
            });
        } catch (e) {
            return res.status(500).json({
                errors: {
                    status: 500,
                    path: `POST api/v1/rent/${bikeID}`,
                    title: "Database error",
                    message: e.message
                }
            });
        } finally {
            await db.client.close();
        }
    },
}

module.exports = rent;
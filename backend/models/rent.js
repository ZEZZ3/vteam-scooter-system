const ObjectId = require('mongodb').ObjectId;
const database = require("../database/database.js");
const helpers = require("../utils/helpers.js");

const rent = {

    /**
     * Show the status of a specific bike.
     */
    getRentStatus: async function (res, req) {
        const bikeID = req.params.bikeID;

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

            return res.status(200).json({ data: {status: bike.status } });
        } catch (e) {
            return res.status(500).json({
                error: {
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
                        path: `POST api/v1/rent/start/${bikeID}`,
                        title: "Not found",
                        message: `Bike with ID: ${bikeID} could not be found`
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

    validateNotRented: async function (bikeID) {
        let dbBikes;
        try {

            dbBikes = await database.getDb("bikes");
            
            const bike = await dbBikes.collection.findOne({_id: new ObjectId(bikeID)});
            
            if (bike.status === "rented") {
                return {
                    error: {
                        status: 409,
                        path: `POST api/v1/rent/start/${bikeID}`,
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

    validateRide: async function(bikeID) {
        let dbRides

        try {
            dbRides = await database.getDb("rides");
            const activeRide = await dbRides.collection.findOne({bike: new ObjectId(bikeID), active: true});

            // trying to rent an active bike
            if (activeRide) {
                return {
                    error: {
                        status: 409,
                        path: `POST api/v1/rent/start/${bikeID}`,
                        title: "Conflict",
                        message: `Bike with ID: ${bikeID} is already in a ride and cant be rented.`
                    }
                }               
            }
            
            return activeRide
        } finally {
            if (dbRides) {
                await dbRides.client.close();
            }
        }
    },

    updateBike: async function(bikeID) {
        let dbBikes
        
        try {
            dbBikes = await database.getDb("bikes");
            const updateBike = await dbBikes.collection.findOneAndUpdate(
                { _id: new ObjectId(bikeID) },
                { $set: { status: "rented" } },
                { returnDocument: "after" }
            );

            if (!updateBike) {
                return {
                    error: {
                        status: 404,
                        path: `POST api/v1/rent/start/${bikeID}`,
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
        let dbUser
        
        try {
            dbUser = await database.getDb("users");
            const user = await dbUser.collection.findOne({_id: new ObjectId(userID)});

            if (!user) {
                return {
                    error: {
                        status: 404,
                        path: `POST api/v1/rent/start/${bikeID}`,
                        title: "Not found",
                        message: `Could not find User with ID: ${req.user.id}`
                    }
                }                
            }
            
            if (!user.balance || user.balance < helpers.minBalance) {
                return {
                    error: {
                        status: 402,
                        path: `POST api/v1/rent/start/${bikeID}`,
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
        let dbRides

        try {
            dbRides = await database.getDb("rides");
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
        const bikeID = req.params.bikeID;
        
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
                return res.status(validateRes.error.status).json({error: validateRes.error});
            }

            validateRes = await this.validateNotRented(bikeID);
            if (validateRes.error) {
                return res.status(validateRes.error.status).json({error: validateRes.error});
            }

            validateRes = await this.validateRide(bikeID)
            if (validateRes?.error) {
                return res.status(validateRes.error.status).json({error: validateRes.error});
            }

            validateRes = await this.validateUser(req.user.id, bikeID)
            if (validateRes.error) {
                return res.status(validateRes.error.status).json({error: validateRes.error});
            }

            validateRes = await this.updateBike(bikeID)
            if (validateRes.error) {
                return res.status(validateRes.error.status).json({error: validateRes.error});
            }
            const bikePos = validateRes.position;
            
            validateRes = await this.createRide(bikeID, req.user.id, bikePos)
            if (validateRes.error) {
                return res.status(validateRes.error.status).json({error: validateRes.error});
            }

            return res.status(201).json({
                 data: {
                    message: "Ride has started",
                    bikeID: bikeID,
                    userID: req.user.id,
                    rideID: validateRes
                 }
            });
        } catch (e) {
            return res.status(500).json({
                error: {
                    status: 500,
                    path: `POST api/v1/rent/start/${bikeID}`,
                    title: "Database error",
                    message: e.message
                }
            });
        } 
    },

    validateActiveRide: async function (user, bikeID) {
        let dbRides

        try {
            dbRides = await database.getDb("rides");
            const activeRide = await dbRides.collection.findOne({
                bike: new ObjectId(bikeID),
                active: true
            });
            
            if (!activeRide) {
                return {
                    error: {
                        status: 404,
                        path: `POST api/v1/rent/stop/${bikeID}`,
                        title: "Not found",
                        message: `Could not find ride for bike with id: ${bikeID}`
                    }
                }               
            }

            // only user who started the ride or an admin can make changes
            if (user.role !== "admin" && activeRide.user.toString() !== user.id.toString()) {
                return {
                    error: {
                        status: 403,
                        path: `POST api/v1/rent/${bikeID}`,
                        title: "Forbidden",
                        message: "You are not allowed to stop this ride"
                    }
                }        
            }
            
            return activeRide;

        } finally {
            await dbRides.client.close();
        }        
    },

    updateBikeAvailable: async function (bikeID) {
        let dbBikes

        try {
            dbBikes = await database.getDb("bikes");
            const updateBike = await dbBikes.collection.findOneAndUpdate(
                { _id: new ObjectId(bikeID) },
                { $set: { status: "free" } },
                { returnDocument: "after" }
            );
            
            if (!updateBike) {
                return {
                    error: {
                        status: 404,
                        path: `POST api/v1/rent/stop/${bikeID}`,
                        title: "Not found",
                        message: `Could not find bike with id: ${bikeID}`
                    }
                }                
            }
            return updateBike;

        } finally {
            await dbBikes.client.close();
        }        
    },

    calculateCost: function(start, stop) {
        const time = stop - start;
        const minutes = Math.ceil(time/ (1000 * 60))
        const price = helpers.startingFee + helpers.minuteFee * minutes;
        return { minutes, price }
    },

    endRide: async function (bikeID, rideID, userID, bikePos, parkingType) {
        let dbRides;
        let dbUsers;

        try {
            dbRides = await database.getDb("rides");
            const ride = await dbRides.collection.findOne({ _id: new ObjectId(rideID)});
            if (!ride) {
                return {
                    error: {
                        status: 404,
                        path: `POST api/v1/rent/stop/${bikeID}`,
                        title: "Not found",
                        message: `Could not find ride with id: ${rideID}`
                    }
                }               
            }
            
            const stop = new Date();
            const { minutes, price } = this.calculateCost(ride.start, stop);
            const update = await dbRides.collection.findOneAndUpdate(
                { _id: new ObjectId(rideID) },
                {
                    $set: {
                        stop: stop,
                        stopPos: bikePos,
                        duration: minutes,
                        price: price,
                        parking: parkingType,
                        active: false
                    }
                },
                { returnDocument: "after" }
            );
            if (!update) {
                return {
                    error: {
                        status: 500,
                        path: `POST api/v1/rent/stop/${bikeID}`,
                        title: "Could not update",
                        message: "Could not end ride"
                    }
                }
            }

            dbUsers = await database.getDb("users");
            const user = await dbUsers.collection.findOneAndUpdate(
                { _id: new ObjectId(userID) },
                { $inc: { balance: -price }},
                { returnDocument: "after" }
            );
           
            if(!user) {
                return {
                    error: {
                        status: 500,
                        path: `POST api/v1/rent/stop/${bikeID}`,
                        title: "Could not update",
                        message: "Could not update user balance"
                    }
                }                   
            }

            return {
                ride: update,
                duration: minutes,
                price: price,
                balance: user.balance
            }

        } 
        finally {
            await dbRides.client.close();
            await dbUsers.client.close();
        }        
    },

    stopRide: async function (res, req) {
        const bikeID = req.params.bikeID;
        const parkingType = req.body.parkingType;
        
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

        if (!parkingType) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `POST api/v1/rent/stop/${bikeID}`,
                    title: "Bad Request",
                    message: "Parking type is missing"
                }
            });
        }

        try {
            let validateRes;

            validateRes = await this.validateBike(bikeID);
            if (validateRes.error) {
                return res.status(validateRes.error.status).json({error: validateRes.error});
            }

            validateRes = await this.validateActiveRide(req.user, bikeID)
            if (validateRes.error) {
                return res.status(validateRes.error.status).json({error: validateRes.error});
            }
            const activeRideID = validateRes._id

            validateRes = await this.updateBikeAvailable(bikeID)
            if (validateRes.error) {
                return res.status(validateRes.error.status).json({error: validateRes.error});
            }
            const bikePos = validateRes.position;

            validateRes = await this.endRide(bikeID, activeRideID, req.user.id, bikePos, parkingType)
            if (validateRes.error) {
                return res.status(validateRes.error.status).json({error: validateRes.error});
            }

            return res.status(200).json({
                 data: {
                    message: "Ride has ended",
                    bikeID: bikeID,
                    userID: req.user.id,
                    rideID: validateRes.ride._id,
                    duration: validateRes.duration,
                    price: validateRes.price,
                    balance: validateRes.balance
                 }
            });
        } catch (e) {
            return res.status(500).json({
                error: {
                    status: 500,
                    path: `POST api/v1/rent/start/${bikeID}`,
                    title: "Database error",
                    message: e.message,
                    stack: process.env.NODE_ENV === "test" ? e.stack : undefined
                }
            });
        } 

    },
}

module.exports = rent;
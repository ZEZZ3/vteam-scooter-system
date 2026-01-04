const ObjectId = require('mongodb').ObjectId;
const database = require("../database/database.js");

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

        if (type) {
            if (type !== "rides" && type !== "payments") {

                return res.status(400).json({
                    error: {
                        status: 400,
                        path: `GET api/v1/history?userID=${userID}&type=${type}`,
                        title: "Bad request",
                        message: `Invalid type: ${type}`
                    }
                });     
            }
        }

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


                if (userID && !ObjectId.isValid(userID)) {
                    return res.status(400).json({
                        error: {
                            status: 400,
                            path: `GET api/v1/history?userID=${userID}`,
                            title: "Bad request",
                            message: `Invalid ID: ${userID}`
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
            query = userID ? { user: new ObjectId(userID) } : {}

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
                    path: "GET api/v1/history",
                    title: "Database error",
                    message: e.message,
                    stack: e.stack
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

    /**
     * Get specific ride
     */
    getSpecificRide: async function (res, req) {
        const userID = req.params.userID;
        const rideID = req.params.rideID;

        if (!ObjectId.isValid(userID)) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `GET api/v1/history/${userID}/rides/${rideID}`,
                    title: "Bad request",
                    message: `Invalid user ID: ${userID}`
                }
            });            
        }

        if (!ObjectId.isValid(rideID)) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `GET api/v1/history/${userID}/rides/${rideID}`,
                    title: "Bad request",
                    message: `Invalid ride ID: ${rideID}`
                }
            });            
        }

        if (req.user.role !== "admin") {
            if (req.user.id !== userID) {
                return res.status(403).json({
                    error: {
                        status: 403,
                        path: `GET api/v1/history/${userID}/rides/${rideID}`,
                        title: "Forbidden",
                        message: "You dont have access to this data."
                    }
                });
            }
        }

        let db;

        try {
            db = await database.getDb("rides");
            const ride = await db.collection.findOne({_id: new ObjectId(rideID)});

            if (!ride) {
                return res.status(404).json({
                    error: {
                        status: 404,
                        path: `GET api/v1/history/${userID}/rides/${rideID}`,
                        title: "Not found",
                        message: `Ride with id '${rideID}' not found.`
                    }
                });
            }

            return res.status(200).json({ data: ride });
        } catch (e) {
            return res.status(500).json({
                error: {
                    status: 500,
                    path: `GET api/v1/history/${userID}/rides/${rideID}`,
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
     * Delete specific ride
     */
    deleteSpecificRide: async function (res, req) {
        const userID = req.params.userID;
        const rideID = req.params.rideID;

        if (!ObjectId.isValid(userID)) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `DELETE api/v1/history/${userID}/rides/${rideID}`,
                    title: "Bad request",
                    message: `Invalid user ID: ${userID}`
                }
            });            
        }

        if (!ObjectId.isValid(rideID)) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `DELETE api/v1/history/${userID}/rides/${rideID}`,
                    title: "Bad request",
                    message: `Invalid ride ID: ${rideID}`
                }
            });            
        }

        if (req.user.role !== "admin") {
            if (req.user.id !== userID) {
                return res.status(403).json({
                    error: {
                        status: 403,
                        path: `DELETE api/v1/history/${userID}/rides/${rideID}`,
                        title: "Forbidden",
                        message: "You dont have access to this data."
                    }
                });
            }
        }

        let db;

        try {
            db = await database.getDb("rides");
            const ride = await db.collection.deleteOne({_id: new ObjectId(rideID)});

            if (ride.deletedCount === 0) {
                return res.status(404).json({
                    error: {
                        status: 404,
                        path: `DELETE api/v1/history/${userID}/rides/${rideID}`,
                        title: "Not found",
                        message: `Ride with id '${rideID}' not found.`
                    }
                });
            }

            return res.status(200).json({ data: {message: "Ride has been deleted"} });
        } catch (e) {
            return res.status(500).json({
                error: {
                    status: 500,
                    path: `DELETE api/v1/history/${userID}/rides/${rideID}`,
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
     * Get specific payment
     */
    getSpecificPayment: async function (res, req) {
        const userID = req.params.userID;
        const paymentID = req.params.paymentID;

        if (!ObjectId.isValid(userID)) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `GET api/v1/history/${userID}/payments/${paymentID}`,
                    title: "Bad request",
                    message: `Invalid user ID: ${userID}`
                }
            });            
        }

        if (!ObjectId.isValid(paymentID)) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `GET api/v1/history/${userID}/payments/${paymentID}`,
                    title: "Bad request",
                    message: `Invalid payment ID: ${paymentID}`
                }
            });            
        }

        if (req.user.role !== "admin") {
            if (req.user.id !== userID) {
                return res.status(403).json({
                    error: {
                        status: 403,
                        path: `GET api/v1/history/${userID}/payments/${paymentID}`,
                        title: "Forbidden",
                        message: "You dont have access to this data."
                    }
                });
            }
        }

        let db;

        try {
            db = await database.getDb("payments");
            const payment = await db.collection.findOne({_id: new ObjectId(paymentID)});

            if (!payment) {
                return res.status(404).json({
                    error: {
                        status: 404,
                        path: `GET api/v1/history/${userID}/payments/${paymentID}`,
                        title: "Not found",
                        message: `Payment with id '${paymentID}' not found.`
                    }
                });
            }

            return res.status(200).json({ data: payment });
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

    /**
     * Delete specific payment
     */
    deleteSpecificPayment: async function (res, req) {
        const userID = req.params.userID;
        const paymentID = req.params.paymentID;

        if (!ObjectId.isValid(userID)) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `DELETE api/v1/history/${userID}/payments/${paymentID}`,
                    title: "Bad request",
                    message: `Invalid user ID: ${userID}`
                }
            });            
        }

        if (!ObjectId.isValid(paymentID)) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `DELETE api/v1/history/${userID}/payments/${paymentID}`,
                    title: "Bad request",
                    message: `Invalid payment ID: ${paymentID}`
                }
            });            
        }

        if (req.user.role !== "admin") {
            if (req.user.id !== userID) {
                return res.status(403).json({
                    error: {
                        status: 403,
                        path: `DELETE api/v1/history/${userID}/payments/${paymentID}`,
                        title: "Forbidden",
                        message: "You dont have access to this data."
                    }
                });
            }
        }

        let db;

        try {
            db = await database.getDb("payments");
            const payment = await db.collection.deleteOne({_id: new ObjectId(paymentID)});

            if (payment.deletedCount === 0) {
                return res.status(404).json({
                    error: {
                        status: 404,
                        path: `DELETE api/v1/history/${userID}/payments/${paymentID}`,
                        title: "Not found",
                        message: `Payment with id '${paymentID}' not found.`
                    }
                });
            }

            return res.status(200).json({ data: {message: "Payment has been deleted"} });
        } catch (e) {
            return res.status(500).json({
                error: {
                    status: 500,
                    path: `DELETE api/v1/history/${userID}/payments/${rideID}`,
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

module.exports = history;

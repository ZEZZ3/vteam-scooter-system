const ObjectId = require('mongodb').ObjectId;
const database = require("../database/database.js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)

const payment = {

    /**
     * Fill user balance using stripe API.
     */
    fillBalance: async function (res, req) {
        const userID = req.params.userID;
        const amount = req.body.amount;
        const payMethodID = req.body.payMethodID;
        const currency = "sek"; // default 

        if (req.user.id !== userID && req.user.role !== "admin") {
            return res.status(403).json({
                error: {
                    status: 403,
                    path: "POST api/v1/payment/:userID/fill/",
                    title: "Forbidden",
                    message: "Cannot fill balance of other user"
                }
            });
        }


        if (!userID) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `POST api/v1/payment/:userID/fill/`,
                    title: "Bad Request",
                    message: "User ID is missing"
                }
            });         
        }

        if (!payMethodID) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `POST api/v1/payment/:userID/fill/`,
                    title: "Bad Request",
                    message: "Payment method ID is missing"
                }
            });         
        }

        if (!Number.isInteger(amount)) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `POST api/v1/payment/:userID/fill/`,
                    title: "Bad Request",
                    message: "Amount needs to an integer"
                }
            });            
        }

        if (!amount || amount <= 3) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `POST api/v1/payment/:userID/fill/`,
                    title: "Bad Request",
                    message: "Amount needs to be greater than 3sek"
                }
            });
        }

        try {
            const payment = await stripe.paymentIntents.create({
                amount: amount * 100,
                currency: currency,
                confirm: true,
                payment_method: payMethodID,
                payment_method_types: ["card"],
                metadata: {
                    userID: userID
                }
            });

            if (payment.status ===  "succeeded") {

                let update = await this.increaseUserBalance(userID, amount);
                const balance = update;

                if (update.error) {
                    return res.status(update.error.status).json({error: update.error});
                }

                update = await this.storePayment(userID, amount, "fill", "finished", payment.id);
                if (update?.error) {
                    return res.status(update.error.status).json({error: update.error});
                }

                return res.status(200).json({
                    status: "success",
                    paymentID: payment.id,
                    amount: amount,
                    balance: balance 
                });
            } else if (payment.status === "requires_action") {
                return res.status(200).json({
                    status: "action_required",
                    paymentID: payment.id,
                    clientSecret: payment.client_secret
                });
            } else {
                return res.status(400).json({
                    error: {
                        status: 400,
                        path: "POST api/v1/payment/:userID/fill/",
                        title: "Payment failed",
                        message: "Could not perform payment",
                        code: payment.status
                    }
                });
            }
        } catch (e) {
            if (e.message === "Your card was declined." ||
                e.message === "Your card has insufficient funds."
            ) {
                return res.status(400).json({
                    error: {
                        status: 400,
                        path: "POST api/v1/payment/:userID/fill/",
                        title: "Declined",
                        message: e.message
                    }
                });                   
            }
            
            return res.status(500).json({
                error: {
                    status: 500,
                    path: "POST api/v1/payment/:userID/fill/",
                    title: "Stripe Error",
                    message: e.message
                }
            });           
        }
    },

    /**
     * Update user blanance.
     */
    increaseUserBalance: async function (userID, amount) {
        let db;

        try {
            db = await database.getDb("users");

            const response = await db.collection.findOneAndUpdate(
                {_id: new ObjectId(userID) },
                { $inc: {balance: amount} },
                { returnDocument: "after" }
            );

            if (!response) {
                return {
                    error: {
                        status: 404,
                        path: `POST api/v1/payment/:userID/fill/`,
                        title: "Not found",
                        message: `Could not find user with id: ${userID}`
                    }
                }  
            }
            return response.balance;
        } catch (e) {
            return {
                error: {
                    status: 500,
                    path: `POST api/v1/payment/:userID/fill/`,
                    title: "Database error",
                    message: e.message
                }
            }
        } finally {
            await db.client.close();
        }        
    },

    /**
     * Update user blanance.
     */
    storePayment: async function (userID, amount, type, status, paymentID) {
        let db;

        try {
            db = await database.getDb("payments");

            await db.collection.insertOne(
                {
                    user: userID,
                    stripePaymentID: paymentID,
                    price: amount,
                    type: type,
                    status: status,
                    createdAt: Date.now()
                }
            );

        } catch (e) {
            return {
                error: {
                    status: 500,
                    path: `POST api/v1/payment/:userID/fill/`,
                    title: "Database error",
                    message: e.message
                }
            }
        } finally {
            await db.client.close();
        }        
    },
};

module.exports = payment;

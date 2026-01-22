const ObjectId = require('mongodb').ObjectId;
const database = require("../database/database.js");
const bcrypt = require('bcryptjs');
const validator = require("validator");
const helpers = require("../utils/helpers.js");
const { verify } = require('jsonwebtoken');

const users = {

    /**
     * An admin can list all users.
     */
    getAllUsers: async function (res, req) {

        if (req.user.role !== "admin") {
            return res.status(403).json({
                error: {
                    status: 403,
                    path: "GET api/v1/users",
                    title: "Forbidden",
                    message: "Admin role required"
                }
            });
        }

        let db;

        try {
            db = await database.getDb("users");

            const users = await db.collection.find({}).toArray();

            /*if (!users || users.lenght === 0) {
                return res.status(404).json({
                    error: {
                        status: 404,
                        path: "GET api/v1/users",
                        title: "Not found",
                        message: "No data found."
                    }
                });
            }
            */
            if (!users || users.length === 0) {
                return res.status(200).json({ data: [] });
            }

            return res.status(200).json({ data: users });
        } catch (e) {
            return res.status(500).json({
                error: {
                    status: 500,
                    path: "GET api/v1/users",
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
     * An admin can register a user and bypass the register route.
     */
    addUser: async function (res, req) {

        if (req.user.role !== "admin") {
            return res.status(403).json({
                error: {
                    status: 403,
                    path: "POST api/v1/users",
                    title: "Forbidden",
                    message: "Admin role required"
                }
            });
        }

        const mail = req.body.mail;
        const password = req.body.password;
        const firstName = req.body.firstName;
        const lastName = req.body.lastName;
        const adress = req.body.adress;
        const postcode = req.body.postcode;
        const city = req.body.city;
        const phone = req.body.phone;
        const balance = 0;
        const role = req.body.role;
        const verified = true;

        if (!mail || !password) {
            return res.status(400).json({
                error: {
                    status: 400,
                    source: "POST api/v1/users/",
                    title: "Email or password missing",
                    detail: "Email or password missing in request"
                }
            });
        }

        if (role !== "admin" && role !== "customer") {
            return res.status(400).json({
                error: {
                    status: 400,
                    source: "POST api/v1/users/",
                    title: "Not a valid role",
                    detail: "Role can only be customer or admin"
                }
            });
        }

        if (!validator.isEmail(mail)) {
            return res.status(400).json({
                error: {
                    status: 400,
                    source: "POST api/v1/users/",
                    title: "Not a valid email",
                    detail: "Email has to be in a valid format."
                }
            });
        }

        bcrypt.hash(password, 10, async function(err, hash) {
            if (err) {
                return res.status(500).json({
                    error: {
                        status: 500,
                        source: "POST api/v1/users/ ",
                        title: "bcrypt error",
                        detail: "bcrypt error"
                    }
                });
            }

            let db;

            try {
                db = await database.getDb("users");

                const exists = await db.collection.findOne( { mail } );
                if (exists) {
                    return res.status(400).json({
                        error: {
                            status: 400,
                            source: "POST api/v1/users/",
                            title: "User already exists",
                            detail: `User already registered: ${mail}`
                        }
                    });
                }

                await db.collection.insertOne({
                    mail,
                    password: hash,
                    firstName,
                    lastName,
                    adress,
                    postcode,
                    city,
                    phone,
                    balance,
                    role,
                    verified,
                    createdAt: new Date()
                });

                return res.status(201).json({
                    data: {
                        message: "User successfully registered."
                    }
                });

            } catch (e) {
                return res.status(500).json({
                    error: {
                        status: 500,
                        source: "POST api/v1/users/",
                        title: "Database error",
                        detail: e.message
                    }
                });
            } finally {
                if (db && db.client) {
                    await db.client.close();
                }
            }
        });
    },

    /**
     * Gets a single user by ID. If user doesnt have admin role, they can only view their own user data.
     * Admins are not restricted.
     */
    getSingleUser: async function (res, req) {
        const requestedID = req.params.id;

        if (!ObjectId.isValid(requestedID)) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `PUT api/v1/users/${requestedID}`,
                    title: "Bad request",
                    message: `Invalid ID: ${requestedID}`
                }
            });            
        }

        if (req.user.role !== "admin") {
            if (req.user.id !== requestedID) {
                return res.status(403).json({
                    error: {
                        status: 403,
                        path: `GET api/v1/users/${requestedID}`,
                        title: "Forbidden",
                        message: "You dont have access to this data."
                    }
                });
            }
        }

        let db;

        try {
            db = await database.getDb("users");
            const user = await db.collection.findOne({_id: new ObjectId(requestedID)});

            if (!user) {
                return res.status(404).json({
                    error: {
                        status: 404,
                        path: `GET api/v1/users/${requestedID}`,
                        title: "Not found",
                        message: `User with id '${requestedID}' not found.`
                    }
                });
            }

            return res.status(200).json({ data: user });
        } catch (e) {
            return res.status(500).json({
                error: {
                    status: 500,
                    path: `GET api/v1/users/${requestedID}`,
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
     * Update a user by ID (full update, all fields will be updated).
     * If user doesnt have admin role, they can only update their own user data.
     * Admins are not restricted.
     */
    updateSingleUser: async function (res, req) {

        const requestedID = req.params.id;

        if (!ObjectId.isValid(requestedID)) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `PUT api/v1/users/${requestedID}`,
                    title: "Bad request",
                    message: `Invalid ID: ${requestedID}`
                }
            });            
        }

        if (req.user.role !== "admin" && req.user.id !== requestedID) {
                return res.status(403).json({
                    error: {
                        status: 403,
                        path: `PUT api/v1/users/${requestedID}`,
                        title: "Forbidden",
                        message: "You dont have access to this data."
                    }
                });
        }

        let db;

        try {
            db = await database.getDb("users");
            
            const fields = ["firstName", "lastName", "adress", "postcode", "city", "phone"]
            let newData = {}
            try {
                newData = helpers.checkPutData(req.body, fields);
            } catch (e) {
                return res.status(400).json({
                    error: {
                        status: 400,
                        path: `PUT api/v1/users/${requestedID}`,
                        title: "Bad request",
                        message: e.message
                    }
                });
            }

            if (req.body.password) {
                newData.password = await bcrypt.hash(req.body.password, 10);
            }

            newData.updatedAt = new Date();

            const response = await db.collection.findOneAndUpdate(
                {_id: new ObjectId(requestedID) },
                { $set: newData },
                { returnDocument: "after" }
            );

            if (!response) {
                return res.status(404).json({
                    error: {
                        status: 404,
                        path: `PUT api/v1/users/${requestedID}`,
                        title: "Not found",
                        message: `User with id '${requestedID}' not found.`
                    }
                });
            }

            delete response.password;

            return res.status(200).json({ data: response });
        } catch (e) {
            console.log(e.message)
            return res.status(500).json({
                error: {
                    status: 500,
                    path: `PUT api/v1/users/${requestedID}`,
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
     * Update a user by ID, partially (just what is sent).
     * If user doesnt have admin role, they can only update their own user data.
     * Admins are not restricted.
     */
    partialUpdateSingleUser: async function (res, req) {

        const requestedID = req.params.id;

        if (!ObjectId.isValid(requestedID)) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `PATCH api/v1/users/${requestedID}`,
                    title: "Bad request",
                    message: `Invalid ID: ${requestedID}`
                }
            });            
        }

        if (req.user.role !== "admin" && req.user.id !== requestedID) {
            return res.status(403).json({
                error: {
                    status: 403,
                    path: `PATCH api/v1/users/${requestedID}`,
                    title: "Forbidden",
                    message: "You dont have access to this data."
                }
            });
        }

        let db;

        try {
            db = await database.getDb("users");

            const fields = ["firstName", "lastName", "adress", "postcode", "city", "phone", "password", "mail", "role", "balance"]
            const newData = helpers.checkPatchData(req.body, fields);
            
            if (newData.password) {
                newData.password = await bcrypt.hash(newData.password, 10);
            }

            if (Object.keys(newData).length === 0) {
                return res.status(400).json({
                    error: {
                        status: 400,
                        path: `PATCH api/v1/users/${requestedID}`,
                        title: "Bad request",
                        message: "No data to update"
                    }
                });
            }

            newData.updatedAt = new Date();

            const response = await db.collection.findOneAndUpdate(
                {_id: new ObjectId(requestedID) },
                { $set: newData },
                { returnDocument: "after" }
            );

            if (!response) {
                return res.status(404).json({
                    error: {
                        status: 404,
                        path: `PATCH api/v1/users/${requestedID}`,
                        title: "Not found",
                        message: `User with id '${requestedID}' not found.`
                    }
                });
            }

            delete response.password;

            return res.status(200).json({ data: response });
        } catch (e) {
            return res.status(500).json({
                error: {
                    status: 500,
                    path: `PATCH api/v1/users/${requestedID}`,
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
     * Delete a user by ID.
     * If user doesnt have admin role, they can only delete their own user data.
     * Admins are not restricted.
     */
    deleteUser: async function (res, req) {
        const requestedID = req.params.id;

        if (!ObjectId.isValid(requestedID)) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `DELETE api/v1/users/${requestedID}`,
                    title: "Bad request",
                    message: `Invalid ID: ${requestedID}`
                }
            });            
        }

        if (req.user.role !== "admin") {
            if (req.user.id !== requestedID) {
                return res.status(403).json({
                    error: {
                        status: 403,
                        path: `DELETE api/v1/users/${requestedID}`,
                        title: "Forbidden",
                        message: "You dont have access to this functionality."
                    }
                });
            }
        }

        let db;

        try {
            db = await database.getDb("users");

            const response = await db.collection.deleteOne(
                { _id: new ObjectId(requestedID) }
            );

            if (response.deletedCount === 0) {
                return res.status(404).json({
                    error: {
                        status: 404,
                        path: `DELETE api/v1/users/${requestedID}`,
                        title: "Not found",
                        message: `User with id '${requestedID}' not found.`
                    }
                });
            }

            return res.status(200).json({ data: { message: "User has been deleted" }});
        } catch (e) {
            return res.status(500).json({
                error: {
                    status: 500,
                    path: `DELETE api/v1/users/${requestedID}`,
                    title: "Database error",
                    message: e.message,
                }
            });
        } finally {
            if (db && db.client) {
                await db.client.close();
            }
        }
    },

    verifyUser: async function (res, req) {
        const token = req.query.token;
        
        if (!token) {
            return res.status(400).json({
                error: {
                    status: 400,
                    path: `GET api/v1/users/verify`,
                    title: "Bad request",
                    message: `Token is required`
                }
            });            
        }

        let db;

        try {
            db = await database.getDb("users");

            const response = await db.collection.findOne(
                { verificationToken: token }
            );

            if (!response) {
                return res.status(404).json({
                    error: {
                        status: 404,
                        path: `GET api/v1/users/verify`,
                        title: "Not found",
                        message: "Token not found"
                    }
                });
            }

            if (Date.now() > response.tokenExpires) {
                return res.status(400).json({
                    error: {
                        status: 400,
                        path: `GET api/v1/users/verify`,
                        title: "Token has expired",
                        message: "Verification token has expired. A token is only valid for 30 minutes."
                    }
                });
            }

            // prob not gonna run because verification token is set to null when verified
            if (response.verified) {
                return res.status(200).json({
                    data: { message: "Already verified" }
                });                
            }

            const newData = {
                verified: true,
                tokenValidity: null,
                tokenExpires: null,
                verificationToken: null
            }

            newData.updatedAt = new Date();

            const update = await db.collection.findOneAndUpdate(
                { _id: new ObjectId(response._id) },
                { $set: newData }
            );

            if (!update) {
                return res.status(500).json({
                    error: {
                        status: 500,
                        path: `GET api/v1/users/verify`,
                        title: "Could not verify user",
                        message: "There was a problem verifying the user."
                    }
                });                
            }

            return res.status(200).json({ data: { message: "User has been verified" }});
        } catch (e) {
            return res.status(500).json({
                error: {
                    status: 500,
                    path: `GET api/v1/users/verify`,
                    title: "Database error",
                    message: e.message,
                    stack: process.env.NODE_ENV === "test" ? e.stack : undefined
                }
            });
        } finally {
            if (db && db.client) {
                await db.client.close();
            }
        }
    }
};

module.exports = users;

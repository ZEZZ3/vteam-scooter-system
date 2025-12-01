const ObjectId = require('mongodb').ObjectId;
const database = require("../database/database.js");
const bcrypt = require('bcryptjs');
const validator = require("validator");

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

            if (!users || users.lenght === 0) {
                return res.status(404).json({
                    error: {
                        status: 404,
                        path: "GET api/v1/users",
                        title: "Not found",
                        message: "No data found."
                    }
                });
            }

            return res.status(200).json({ data: users });
        } catch (e) {
            return res.status(500).json({
                errors: {
                    status: 500,
                    path: "GET api/v1/users",
                    title: "Database error",
                    message: e.message
                }
            });
        } finally {
            await db.client.close();
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

        const mail = body.mail;
        const password = body.password;
        const firstName = body.firstName;
        const lastName = body.lastName;
        const adress = body.adress;
        const postcode = body.postcode;
        const city = body.city;
        const phone = body.phone;
        const balance = 0;
        const role = body.role;
        const verified = true;

        if (!mail || !password) {
            return res.status(401).json({
                error: {
                    status: 401,
                    source: "POST api/v1/users/register",
                    title: "Email or password missing",
                    detail: "Email or password missing in request"
                }
            });
        }

        if (!validator.isEmail(mail)) {
            return res.status(400).json({
                error: {
                    status: 400,
                    source: "POST api/v1/users/register",
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
                            source: "POST api/v1/users/register",
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
                await db.client.close();
            }
        });
    },

    /**
     * Gets a single user by ID. If user doesnt have admin role, they can only view their own user data.
     * Admins are not restricted.
     */
    getSingleUser: async function (res, req) {
        const requestedID = req.params.id;
        
        if (req.user.role !== "admin") {
            if (req.user._id !== ObjectId(requestedID)) {
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
            const user = await db.collection.findOne({email:req.user.mail});

            if (!user || user.lenght === 0) {
                return res.status(404).json({
                    error: {
                        status: 404,
                        path: `GET api/v1/users/${requestedID}`,
                        title: "Not found",
                        message: "No data found."
                    }
                });
            }

            return res.status(200).json({ data: user });
        } catch (e) {
            return res.status(500).json({
                errors: {
                    status: 500,
                    path: `GET api/v1/users/${requestedID}`,
                    title: "Database error",
                    message: e.message
                }
            });
        } finally {
            await db.client.close();
        }
    },
};

module.exports = users;
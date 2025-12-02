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

    /**
     * Update a user by ID (full update, all fields will be updated).
     * If user doesnt have admin role, they can only update their own user data.
     * Admins are not restricted.
     */
    updateSingleUser: async function (res, req) {

        const requestedID = req.params.id;

        const {
            firstName,
            lastName,
            adress,
            postcode,
            city,
            phone,
            password
        } = req.body;

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

            const newData = {
                firstName,
                lastName,
                adress,
                postcode,
                city,
                phone,
                password
            }

            if (password) {
                newData.password = await bcrypt.hash(password, 10);
            }

            const response = await db.collection.findOneAndUpdate(
                {_id: new ObjectId(requestedID) },
                { $set: newData },
                { returnDocument: "after" }
            );

            if (!response.value) {
                return res.status(404).json({
                    error: {
                        status: 404,
                        path: `PUT api/v1/users/${requestedID}`,
                        title: "Not found",
                        message: `User with id '${requestedID}' not found.`
                    }
                });
            }

            delete response.value.password;

            return res.status(200).json({ data: response.value });
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

    /**
     * Update a user by ID, partially (just what is sent).
     * If user doesnt have admin role, they can only update their own user data.
     * Admins are not restricted.
     */
    partialUpdateSingleUser: async function (res, req) {

        const requestedID = req.params.id;

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

            const newData = { ...req.body }
            delete newData.mail;

            if (newData.password) {
                newData.password = await bcrypt.hash(newData.password, 10);
            }

            const response = await db.collection.findOneAndUpdate(
                {_id: new ObjectId(requestedID) },
                { $set: newData },
                { returnDocument: "after" }
            );

            if (!response.value) {
                return res.status(404).json({
                    error: {
                        status: 404,
                        path: `PUT api/v1/users/${requestedID}`,
                        title: "Not found",
                        message: `User with id '${requestedID}' not found.`
                    }
                });
            }

            delete response.value.password;

            return res.status(200).json({ data: response.value });
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
    }
};

module.exports = users;

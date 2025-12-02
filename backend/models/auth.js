const database = require("../database/database.js");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ObjectId } = require("mongodb");
const crypto = require("crypto");
const validator = require("validator");

const jwtSecret = process.env.JWT_SECRET;

const auth = {

    register: async function(res, body) {
        const mail = body.mail;
        const password = body.password;
        const firstName = body.firstName;
        const lastName = body.lastName;
        const adress = body.adress;
        const postcode = body.postcode;
        const city = body.city;
        const phone = body.phone;
        const balance = 0;
        const role = "customer";
        const verified = false;
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const tokenValidity = Date.now() + 1000 * 60 * 30; // 30 min

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
                        source: "POST api/v1/users/register",
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
                    verificationToken,
                    tokenExpires: new Date(tokenValidity),
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
                        source: "POST api/v1/users/register",
                        title: "Database error",
                        detail: e.message
                    }
                });
            } finally {
                await db.client.close();
            }
        });
    },

    login: async function(res, body) {
        const mail = body.mail;
        const password = body.password;

        if (!mail || !password) {
            return res.status(400).json({
                error: {
                    status: 400,
                    source: "POST api/v1/users/login",
                    title: "Email or password missing",
                    detail: "Email or password missing in request"
                }
            });
        }

        let db;

        try {
            db = await database.getDb("users");

            const user = await db.collection.findOne({ mail });
            if (user) {
                return auth.comparePasswords(
                    res,
                    password,
                    user,
                );
            } else {
                return res.status(401).json({
                    error: {
                        status: 401,
                        source: "POST api/v1/users/login",
                        title: "User not found",
                        detail: "User with provided email not found."
                    }
                });
            }
        } catch (e) {
            return res.status(500).json({
                error: {
                    status: 500,
                    source: "POST api/v1/users/login",
                    title: "Database error",
                    detail: e.message
                }
            });
        } finally {
            await db.client.close();
        }
    },

    comparePasswords: function(res, password, user) {
        bcrypt.compare(password, user.password, (err, result) => {
            if (err) {
                return res.status(500).json({
                    error: {
                        status: 500,
                        source: "api/v1/users/login",
                        title: "bcrypt error",
                        detail: "bcrypt error"
                    }
                });
            }

            if (result) {
                let payload = { mail: user.mail, role: user.role, id: user._id };
                let jwtToken = jwt.sign(payload, jwtSecret, { expiresIn: '24h' });

                return res.json({
                    data: {
                        type: "success",
                        message: "User logged in",
                        user: payload,
                        token: jwtToken
                    }
                });
            }

            return res.status(401).json({
                error: {
                    status: 401,
                    source: "api/v1/users/login",
                    title: "Wrong password",
                    detail: "Password is incorrect."
                }
            });
        });
    },

    checkToken: function(req, res, next) {
        let token = req.headers['x-access-token'];

        if (token) {
            //console.log(token)
            jwt.verify(token, jwtSecret, function(err, decoded) {
                if (err) {
                    return res.status(500).json({
                        error: {
                            status: 500,
                            source: req.path,
                            title: "Failed authentication",
                            detail: err.message
                        }
                    });
                }

                req.user = {};
                req.user.mail = decoded.mail;
                req.user.role = decoded.role;

                return next();
            });
        } else {
            return res.status(401).json({
                error: {
                    status: 401,
                    source: req.path,
                    title: "No token",
                    detail: "No token provided in request headers"
                }
            });
        }
    },

    /*
    deregister: async function(res, body) {
        const email = body.email;
        const password = body.password;

        if (!email || !password) {
            return res.status(401).json({
                error: {
                    status: 401,
                    source: "DELETE api/v1/deregister",
                    title: "Email or password missing",
                    detail: "Email or password missing in request"
                }
            });
        }

        let db;
        try {
            db = await database.getDb("users");

            const filter = { email: email };

            const keyObject = await db.collection.findOne(filter);

            if (!keyObject) {
                return res.status(404).json({
                    error: {
                        status: 404,
                        source: "DELETE api/v1/deregister",
                        title: "User not found",
                        detail: `Couldnt find user: ${email}`
                    }
                });
            }
            const validPassword = await bcrypt.compare(password, keyObject.password);
            if (!validPassword) {
                return res.status(401).json({
                    error: {
                        status: 401,
                        source: "DELETE api/v1/deregister",
                        title: "Wrong password",
                        detail: "Incorrect password given, could not deregister."
                    }
                });
            }

            return await auth.deleteData(res, email, db);
        } catch (e) {
            return res.status(500).json({
                error: {
                    status: 500,
                    source: "DELETE api/v1/deregister",
                    title: "Database error",
                    detail: e.message
                }
            });
        }
        finally {
            await db.client.close();
        }

    }, */
};

module.exports = auth;

"use strict";

require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const morgan = require("morgan");
const cors = require("cors");

const users = require("./routes/v1/users.js");
const bikes = require("./routes/v1/users.js");
const city = require("./routes/v1/users.js");
const history = require("./routes/v1/users.js");
const payment = require("./routes/v1/users.js");
const rent = require("./routes/v1/users.js");

const app = express();

app.disable('x-powered-by');

app.set("view engine", "ejs");

app.use(express.static(path.join(process.cwd(), "public")));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use('api/v1/users', users);
app.use('api/v1/bikes', bikes);
app.use('api/v1/city', city);
app.use('api/v1/history', history);
app.use('api/v1/payment', payment);
app.use('api/v1/rent', rent);

// don't show the log when it is test
if (process.env.NODE_ENV !== 'test') {
    // use morgan to log at command line
    app.use(morgan('combined')); // 'combined' outputs the Apache style LOGs
}

/**
 * Error handling
 */
app.use((req, res, next) => {
    var err = new Error("Not Found");

    err.status = 404;
    next(err);
});

app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    res.status(err.status || 500).json({
        "errors": [
            {
                "status": err.status,
                "title":  err.message,
                "detail": err.message
            }
        ]
    });
});

module.exports = app;
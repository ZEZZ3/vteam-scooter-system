var express = require('express');
var router = express.Router();

const auth = require("../../models/auth.js");
const payment = require("../../models/payment.js");

/***************************************************************************************************
 | Uri                                       |  GET  | POST | PUT | PATCH | DELETE |
 |-------------------------------------------|:-----:|:----:|:---:|:-----:|:------:|
 | /v1/payment/{userid}/fill                 |  -    | Yes  | -   |  -    |  -     |
 ***************************************************************************************************/


// POST api/v1/payment/:userID/fill
// Fill balance
router.post('/:userID/fill',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => payment.fillBalance(res, req)
);

module.exports = router;
var express = require('express');
var router = express.Router();

const auth = require("../../models/auth.js");
const rent = require("../../models/rent.js");

// GET api/v1/rent/:id
// Get bikes rental status
router.get('/:bikeid',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => rent.getRentStatus(res, req)
);

// POST api/v1/rent/:id
// Change the status of a bike
router.post('/:bikeid',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => rent.changeStatus(res, req)
);
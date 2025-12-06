var express = require('express');
var router = express.Router();

const auth = require("../../models/auth.js");
const rent = require("../../models/rent.js");

// GET api/v1/rent/:id
// 
router.get('/:bikeid',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => rent.getAllUsers(res, req)
);

// POST api/v1/rent/:id
// 
router.post('/:bikeid',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => rent.getAllUsers(res, req)
);
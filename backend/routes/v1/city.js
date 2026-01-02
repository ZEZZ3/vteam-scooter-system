var express = require('express');
var router = express.Router();

const auth = require("../../models/auth.js");
const city = require("../../models/city.js");

// GET api/v1/city/
// Get all cities
router.get('/',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => city.getAllCities(res, req)
);

// POST api/v1/city/
// Add a city
// Limited to admins
router.post('/', (req, res) => {
    res.status(200).json({
        status: "Not implemented"
    });
});

// GET api/v1/city/:cityID
// Get city by ID
router.get('/:cityID', (req, res) => {
    res.status(200).json({
        status: "Not implemented"
    });
});

// PATCH api/v1/city/:cityID
// Update city by ID
router.patch('/:cityID', (req, res) => {
    res.status(200).json({
        status: "Not implemented"
    });
});

// DELETE api/v1/city/:cityID
// Delete city by ID
router.delete('/:cityID', (req, res) => {
    res.status(200).json({
        status: "Not implemented"
    });
});


module.exports = router;
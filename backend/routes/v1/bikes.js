var express = require('express');
var router = express.Router();

const auth = require("../../models/auth.js");

// GET api/v1/bikes/
// Get all bikes
// Admins can use queries like ?rented, ?free
// Users dont see rented bikes
router.get('/', (req, res) => {
    res.status(200).json({
        status: "Not implemented"
    });
});

// POST api/v1/bikes/
// Add a bike, requires admin privilege
router.post('/', (req, res) => {
    res.status(200).json({
        status: "Not implemented"
    });
});

// GET api/v1/bikes/:bikeID
// Get bike by ID
// Admins are not restricted, users can only get free bikes
router.get('/:bikeID', (req, res) => {
    res.status(200).json({
        status: "Not implemented"
    });
});


// PUT api/v1/bikes/:bikeID
// Update bike
// Exclusive to admins
/* router.put('/:bikeID', (req, res) => {
    res.status(200).json({
        status: "Not implemented"
    });
}); */

// PATCH api/v1/bikes/:bikeID
// Update bike partially
// Exclusive to admins
router.patch('/:bikeID', (req, res) => {
    res.status(200).json({
        status: "Not implemented"
    });
});

// DELETE api/v1/bikes/:bikeID
// Delete bike
// Exclusive to admins
router.delete('/:bikeID', (req, res) => {
    res.status(200).json({
        status: "Not implemented"
    });
});

module.exports = router;
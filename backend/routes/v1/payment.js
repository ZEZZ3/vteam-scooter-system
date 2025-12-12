var express = require('express');
var router = express.Router();

const auth = require("../../models/auth.js");

// POST api/v1/payment/:userID/fill
// Fill balance
router.post('/:userID/fill', (req, res) => {
    res.status(200).json({
        status: "Not implemented"
    });
});

// GET api/v1/payment/:userID/:rideID
// Get status of a payment
// Admins can see payments without restriction
// Users dont see payments that dont belong to them
router.get('/:userID/:rideID', (req, res) => {
    res.status(200).json({
        status: "Not implemented"
    });
});

// POST api/v1/payment/:userID/:rideID
// Make a payment
// UserID has to match for a payment to work.
router.post('/:userID/:rideID', (req, res) => {
    res.status(200).json({
        status: "Not implemented"
    });
});

// PATCH api/v1/payment/:userID/:rideID
// Update a payment
// Admin can update a payment if needed
router.patch('/:userID/:rideID', (req, res) => {
    res.status(200).json({
        status: "Not implemented"
    });
});

// DELETE api/v1/payment/:userID/:rideID
// Delete a payment
// Admin can delete a payment
router.patch('/:userID/:rideID', (req, res) => {
    res.status(200).json({
        status: "Not implemented"
    });
});

module.exports = router;
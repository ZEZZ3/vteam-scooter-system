var express = require('express');
var router = express.Router();

const auth = require("../../models/auth.js");
const history = require("../../models/history.js");

// GET api/v1/history
// Get all combined history
// or filter on specifics.
// use ?userID=, ?type=payments or ?type=rides to filter
router.get('/',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => history.getHistory(res, req)
);


// GET api/v1/history/:userID/rides/:rideID
// Get specific ride for a user
// Limited to admins and user with matching id
router.get('/:userID/rides/:rideID',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => history.getSpecificRide(res, req)
);

// PATCH api/v1/history/:userID/rides/:rideID
// Update specific part of ride for a user
// Limited to admins and user with matching id
router.patch('/history/:userID/rides/:rideID', (req, res) => {
    res.status(200).json({
        status: "Not implemented"
    });
});

// DELETE api/v1/history/:userID/rides/:rideID
// Delete specific ride for a user
// Limited to admins and user with matching id
router.delete('/:userID/rides/:rideID',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => history.deleteSpecificRide(res, req)
);

// GET api/v1/history/:userID/payments/:rideID
// Get specific users payment
// Limited to admins and user with matching id
router.get('/:userID/payments/:paymentID',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => history.getSpecificPayment(res, req)
);

// PATCH api/v1/history/:userID/payments/:rideID
// Update specific part of specific users payment for specific ride
// Limited to admins and user with matching id
router.patch('/:userID/payments/:rideID', (req, res) => {
    res.status(200).json({
        status: "Not implemented"
    });
});

// DELETE api/v1/history/:userID/payments/:rideID
// Delete specific users payment for specific ride
// Limited to admins and user with matching id
router.delete('/:userID/payments/:paymentID',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => history.deleteSpecificPayment(res, req)
);

module.exports = router;
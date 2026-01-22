var express = require('express');
var router = express.Router();

const auth = require("../../models/auth.js");
const bikes = require("../../models/bikes.js");

/**************************************************************************************************
| Uri                                       |  GET  | POST | PUT | PATCH | DELETE |
|-------------------------------------------|:-----:|:----:|:---:|:-----:|:------:|
| /v1/bikes                                 |  Yes  | Yes  | -   |  -    |  -     |
| /v1/bikes/{bikeid}                        |  Yes  | -    | -   |  Yes  |  Yes   |
***************************************************************************************************/

// GET api/v1/bikes/
// Get all bikes
// Admins can use queries like ?rented, ?free
// Users and admins can use ?city=ABC
// Users dont see rented bikes
router.get('/',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => bikes.getBikes(res, req)
);

// POST api/v1/bikes/
// Add a bike, requires admin privilege
router.post('/',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => bikes.addBike(res, req)
);

// GET api/v1/bikes/:bikeID
// Get bike by ID
// Admins are not restricted, users can only get free bikes
router.get('/:bikeID',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => bikes.getBikeByID(res, req)
);

// PATCH api/v1/bikes/:bikeID
// Update bike partially
// Exclusive to admins
router.patch('/:bikeID',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => bikes.updateBikeByID(res, req)
);

// DELETE api/v1/bikes/:bikeID
// Delete bike
// Exclusive to admins
router.delete('/:bikeID',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => bikes.deleteBikeByID(res, req)
);

module.exports = router;
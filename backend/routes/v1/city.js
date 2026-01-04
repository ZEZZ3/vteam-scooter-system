var express = require('express');
var router = express.Router();

const auth = require("../../models/auth.js");
const city = require("../../models/city.js");

/************************************************************************************************
| Uri                                       |  GET  | POST | PUT | PATCH | DELETE |
|-------------------------------------------|:-----:|:----:|:---:|:-----:|:------:|
| /v1/city                                  |  Yes  | Yes  | -   |  -    |  -     |   
| /v1/city/{cityid}                         |  Yes  | -    | -   |  -    |  Yes   |   
*************************************************************************************************/

// GET api/v1/city/
// Get all cities
router.get('/',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => city.getAllCities(res, req)
);

// POST api/v1/city/
// Add a city
// Limited to admins
router.post('/',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => city.addCity(res, req)
);

// GET api/v1/city/:cityID
// Get city by ID
router.get('/:cityID',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => city.getCityByID(res, req)
);

// DELETE api/v1/city/:cityID
// Delete city by ID
router.delete('/:cityID',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => city.deleteCity(res, req)
);

module.exports = router;
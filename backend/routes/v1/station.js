var express = require('express');
var router = express.Router();

const auth = require("../../models/auth.js");
const station = require("../../models/station.js");

/************************************************************************************************
| Uri                               |  GET  | POST | PUT | PATCH | DELETE |
|-----------------------------------|:-----:|:----:|:---:|:-----:|:------:|
| /v1/stations                      |  No   | No   | -   |  -    |  -     |   
| /v1/stations/{stationid}          |  No   | -    | -   |  No   |  No    |   
*************************************************************************************************/

// GET api/v1/stations
// Get stations in a city
router.get('/',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => station.getStations(res, req)
);

// POST api/v1/stations
// Add station
router.post('/',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => station.addStation(res, req)
);

// GET api/v1/city/:cityID/stations/:stationID
// Get a station in a city by ID
router.get('/:stationID',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => station.getStationByID(res, req)
);

// PATCH api/v1/stations/:stationID
// Update a station in a city by ID
router.patch('/:stationID',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => station.updateStation(res, req)
);

// DELETE api/v1/stations/:stationID
// Delete a station in a city by ID
router.delete('/:stationID',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => station.deleteStation(res, req)
);

module.exports = router;
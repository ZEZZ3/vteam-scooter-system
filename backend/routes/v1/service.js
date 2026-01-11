var express = require('express');
var router = express.Router();

const auth = require("../../models/auth.js");
const service = require("../../models/service.js");
const station = require("../../models/station.js");
const zone = require("../../models/zone.js");
const simulation = require("../../models/simulation.js");

/************************************************************************************************
| Uri                               |  GET  | POST | PUT | PATCH | DELETE |
|-----------------------------------|:-----:|:----:|:---:|:-----:|:------:|
| /v1/service/token                 |  -    | Yes  | -   |  -    |  -     |   
| /v1/service/simulation            |  -    | Yes  | -   |   -   |  -     |   
| /v1/service/bikes                 |  Yes  | -    | -   |   -   |  -     |   
| /v1/service/stations              |  Yes  | -    | -   |   -   |  -     |   
| /v1/service/zones                 |  Yes  | -    | -   |   -   |  -     |   
*************************************************************************************************/

// POST api/v1/service/token
// Create a service token.
// Used by the bike service
router.post('/token', (req, res) => {
    auth.serviceTokenRegister(res, req.body);
});

// POST api/v1/service/simulation
// Create a simulation entry in the database
// Used by the bike service
router.post('/simulation',
    (req, res, next) => auth.checkServiceToken(req, res, next),
    (req, res) => simulation.createSimulation(res, req)
);

// GET api/v1/service/bikes
// Get all bikes from database.
// Used by the bike service
router.get('/bikes',
    (req, res, next) => auth.checkServiceToken(req, res, next),
    (req, res) => service.getAllBikes(res, req)
);

// GET api/v1/service/stations
// Get all stations from database.
// Used by the bike service
router.get('/stations',
    (req, res, next) => auth.checkServiceToken(req, res, next),
    (req, res) => station.getAllStations(res, req)
);

// GET api/v1/service/zones
// Get all zones from database.
// Used by the bike service
router.get('/zones',
    (req, res, next) => auth.checkServiceToken(req, res, next),
    (req, res) => zone.getAllZones(res, req)
);


module.exports = router;
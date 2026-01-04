var express = require('express');
var router = express.Router();

const auth = require("../../models/auth.js");
const zone = require("../../models/zone.js");

/************************************************************************************************
| Uri                         |  GET  | POST | PUT | PATCH | DELETE |
|-----------------------------|:-----:|:----:|:---:|:-----:|:------:|
| /v1/zones                   |  No   | No   | -   |  -    |  -     | 
| /v1/zones/{zoneid}          |  No   | -    | -   |  No   |  No    |   
*************************************************************************************************/

// GET api/v1/zones
// Get all zones in a city
router.get('/',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => zone.getAllZones(res, req)
);

// GET api/v1/zones
// Add zone to a city
router.post('/',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => zone.addZone(res, req)
);

// GET api/v1/zones/:zoneID
// Get zone in a city by id
router.get('/:zoneID',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => zone.getZoneByID(res, req)
);

// PATCH api/v1/zones/:zoneID
// Update zone in a city by id
router.patch('/:zoneID',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => zone.updateZone(res, req)
);

// DELETE api/v1/zones/:zoneID
// Delete zone in a city by id
router.delete('/:zoneID',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => zone.deleteZone(res, req)
);

module.exports = router;
var express = require('express');
var router = express.Router();

const auth = require("../../models/auth.js");
const service = require("../../models/service.js");
const station = require("../../models/station.js");
const zone = require("../../models/zone.js");
const simulation = require("../../models/simulation.js");

router.post('/token', (req, res) => {
    auth.serviceTokenRegister(res, req.body);
});

router.post('/simulation',
    (req, res, next) => auth.checkServiceToken(req, res, next),
    (req, res) => simulation.createSimulation(res, req)
);

router.get('/bikes',
    (req, res, next) => auth.checkServiceToken(req, res, next),
    (req, res) => service.getAllBikes(res, req)
);

router.get('/stations',
    (req, res, next) => auth.checkServiceToken(req, res, next),
    (req, res) => station.getAllStations(res, req)
);

router.get('/zones',
    (req, res, next) => auth.checkServiceToken(req, res, next),
    (req, res) => zone.getAllZones(res, req)
);


module.exports = router;
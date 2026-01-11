var express = require('express');
var router = express.Router();

const auth = require("../../models/auth.js");
const simulation = require("../../models/simulation.js");

router.get('/simulation',
    (req, res, next) => auth.checkServiceToken(req, res, next),
    (req, res) => simulation.getAllSimulations(res, req)
);

router.get('/simulation/:simulationID',
    (req, res, next) => auth.checkServiceToken(req, res, next),
    (req, res) => simulation.getSimulationByID(res, req)
);

module.exports = router;
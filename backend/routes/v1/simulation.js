var express = require('express');
var router = express.Router();

const auth = require("../../models/auth.js");
const simulation = require("../../models/simulation.js");

/************************************************************************************************
| Uri                               |  GET  | POST | PUT | PATCH | DELETE |
|-----------------------------------|:-----:|:----:|:---:|:-----:|:------:|
| /v1/simulation                    |  Yes  | -    | -   |  -    |  -     |   
| /v1/simulation/{simulationID}     |  Yes  | -    | -   |   -   |  -     |   
*************************************************************************************************/

// GET api/v1/simulation/
// Get all simulations
router.get('/',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => simulation.getAllSimulations(res, req)
);

// GET api/v1/simulation/simulationID
// Get all simulation by ID
router.get('/:simulationID',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => simulation.getSimulationByID(res, req)
);

module.exports = router;
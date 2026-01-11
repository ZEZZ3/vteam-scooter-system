var express = require('express');
var router = express.Router();

const auth = require("../../models/auth.js");
const rent = require("../../models/rent.js");

/*************************************************************************************************
| Uri                                       |  GET  | POST | PUT | PATCH | DELETE |
|-------------------------------------------|:-----:|:----:|:---:|:-----:|:------:|
| /v1/rent/{bikeid}                         |  Yes  | -    | -   |  -    |  -     |
| /v1/rent/start/{bikeid}                   |  -    | Yes  | -   |  -    |  -     |
| /v1/rent/stop/{bikeid}                    |  -    | Yes  | -   |  -    |  -     |
**************************************************************************************************/

// GET api/v1/rent/:id
// Get bikes rental status
router.get('/:bikeID',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => rent.getRentStatus(res, req)
);

// POST api/v1/rent/start/:id
// Start a ride
router.post('/start/:bikeID',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => rent.startRide(res, req)
);

// POST api/v1/rent/stop/:id
// Stop a ride
router.post('/stop/:bikeID',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => rent.stopRide(res, req)
);

module.exports = router;
var express = require('express');
var router = express.Router();

const auth = require("../../models/auth.js");
const service = require("../../models/service.js");

router.post('/token', (req, res) => {
    auth.serviceTokenRegister(res, req.body);
});

router.get('/bikes',
    (req, res, next) => auth.checkServiceToken(req, res, next),
    (req, res) => service.getAllBikes(res, req)
);

module.exports = router;
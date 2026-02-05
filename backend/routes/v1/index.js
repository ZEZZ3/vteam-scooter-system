var express = require('express');
var router = express.Router();

router.get('/', (req, res) => {
    res.status(200).json({
        status: "V1 up and running",
        time: new Date().toISOString()
    });
});

module.exports = router;
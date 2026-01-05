var express = require('express');
var router = express.Router();

/*************************************************************************************************
| Uri                                       |  GET  | POST | PUT | PATCH | DELETE |
|-------------------------------------------|:-----:|:----:|:---:|:-----:|:------:|
| /v1/index                                 |  Yes  | -    | -   |  -    |  -     |
 *************************************************************************************************/

router.get('/', (req, res) => {
    res.status(200).json({
        status: "V1 up and running",
        time: new Date().toISOString()
    });
});

module.exports = router;
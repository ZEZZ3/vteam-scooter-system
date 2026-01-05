var express = require('express');
var router = express.Router();

const auth = require("../../models/auth.js");
const users = require("../../models/users.js");

/**************************************************************************************************
 | Uri                                       |  GET  | POST | PUT | PATCH | DELETE |
 |-------------------------------------------|:-----:|:----:|:---:|:-----:|:------:|
 | /v1/users                                 |  Yes  | Yes  | -   |  -    |  -     |
 | /v1/users/login                           |  -    | Yes  | -   |  -    |  -     |
 | /v1/users/register                        |  -    | Yes  | -   |  -    |  -     |
 | /v1/users/{id}                            |  Yes  | -    | Yes |  Yes  |  Yes   |
 | /v1/users/verify?token=...                |  Yes  | -    | -   |  -    |  -     |
***************************************************************************************************/


// login
router.post('/login', (req, res) => {
    auth.login(res, req.body);
});

// register
router.post('/register', (req, res) => {
    auth.register(res, req.body);
});

// GET api/v1/users/
// Get all users
router.get('/',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => users.getAllUsers(res, req)
);

// POST api/v1/users/
// Add a user
router.post('/',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => users.addUser(res, req)
);

// GET api/v1/users/verify?token=ABC
// verify user
router.get('/verify', (req, res) => {
   users.verifyUser(res, req)
});

// GET api/v1/users/:id
// get user
router.get('/:id',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => users.getSingleUser(res, req)
);

// PUT api/v1/users/:id
// update user
router.put('/:id',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => users.updateSingleUser(res, req)
);

// PATCH api/v1/users/:id
// update user partially
router.patch('/:id',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => users.partialUpdateSingleUser(res, req)
);

// DELETE api/v1/users/:id
// delete user
router.delete('/:id',
    (req, res, next) => auth.checkToken(req, res, next),
    (req, res) => users.deleteUser(res, req)
);

module.exports = router;

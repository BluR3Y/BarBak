const express = require('express');
const router = express.Router();

require('./routes/user-routes').connect(router);

module.exports = router;
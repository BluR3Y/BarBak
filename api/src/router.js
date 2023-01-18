const express = require('express');
const router = express.Router();

require('./routes/tool-routes').connect(router);

module.exports = router;
const express = require('express');
const router = express.Router();
const auth = require('./auth/index');

// Check users session
router.use('/', auth.getUser);

require('./routes/user-routes').connect(router);
require('./routes/drink-routes').connect(router);

module.exports = router;
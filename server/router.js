const express = require('express');
const router = express.Router();
const auth = require('./auth/index');

// Check users session
router.use('/', auth.getUser);

require('./routes/user-routes').connect(router);
require('./routes/drink-routes').connect(router);
require('./routes/drinkware-routes').connect(router);
require('./routes/ingredient-routes').connect(router);
require('./routes/tool-routes').connect(router);
require('./routes/stripe-routes').connect(router);

module.exports = router;
const express = require('express');
const router = express.Router();
const auth = require('./middleware/auth');
const schemaValidator = require('./validator');

// Validate User API Key
router.use('/', auth.keyAuthenticationRequired);

// Validate Request Data
router.use('/', schemaValidator());

require('./routes/drink-routes').connect(router);
require('./routes/drinkware-routes').connect(router);
require('./routes/ingredient-routes').connect(router);
require('./routes/tool-routes').connect(router);

module.exports = router;
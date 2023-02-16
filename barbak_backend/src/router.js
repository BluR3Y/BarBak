const express = require('express');
const router = express.Router();
const auth = require('./auth/index');
const schemaValidator = require('./validator');

// Check users session
router.use('/', auth.getUser);
// Validate Request Data
// router.use('/', schemaValidator);

require('./routes/user-routes').connect(router);
require('./routes/drink-routes').connect(router);
require('./routes/drinkware-routes').connect(router);
require('./routes/ingredient-routes').connect(router);
require('./routes/tool-routes').connect(router);
require('./routes/developer-routes').connect(router);
require('./routes/asset-routes').connect(router);

module.exports = router;
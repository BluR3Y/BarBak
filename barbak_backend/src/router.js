const express = require('express');
const router = express.Router();
const auth = require('./middleware/auth');
const schemaValidator = require('./middleware/validator');

// Check users session
router.use('/', auth.getUser);
// Validate Request Data
// router.use('/', schemaValidator);

require('./routes/user-routes').connect(router);
// require('./routes/drink-routes').connect(router);
// require('./routes/drinkware-routes').connect(router);
// require('./routes/ingredient-routes').connect(router);
// require('./routes/tool-routes').connect(router);
// require('./routes/publication-routes').connect(router);
// require('./routes/media-routes').connect(router);
// require('./routes/developer-routes').connect(router);

module.exports = router;
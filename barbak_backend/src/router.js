const express = require('express');
const router = express.Router();
const authorize = require('./middleware/authorize');

router.use(authorize);

require('./routes/account-routes').connect(router);
require('./routes/user-routes').connect(router);
require('./routes/drinkware-routes').connect(router);
require('./routes/tool-routes').connect(router);
require('./routes/ingredient-routes').connect(router);
require('./routes/drink-routes').connect(router);
// require('./routes/asset-routes').connect(router);

// require('./routes/publication-routes').connect(router);
// require('./routes/media-routes').connect(router);
// require('./routes/developer-routes').connect(router);

module.exports = router;
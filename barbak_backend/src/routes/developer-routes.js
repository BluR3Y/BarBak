const developerController = require('../controllers/developer-controller');
const auth = require('../middleware/auth');

function connectRoutes(router) {
    router.post('/developers/register', auth.sessionAuthenticationRequired, developerController.register);
    router.post('/developers/update-info', auth.sessionAuthenticationRequired, developerController.updateInfo);

    router.get('/developers/regenerate-key', auth.sessionAuthenticationRequired, developerController.regenerateAPIKey);
};

module.exports.connect = connectRoutes;
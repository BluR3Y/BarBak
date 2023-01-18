const developerController = require('../controllers/developer-controller');
const auth = require('../auth/index');

function connectRoutes(router) {
    // router.post('/drinks/create-drink', auth.sessionAuthenticationRequired, drinkController.create_drink);
    router.post('/developer/register', auth.sessionAuthenticationRequired, developerController.register);
};

module.exports.connect = connectRoutes;
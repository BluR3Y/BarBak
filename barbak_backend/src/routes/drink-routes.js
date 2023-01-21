const drinkController = require('../controllers/drink-controller');
const auth = require('../auth/index');

function connectRoutes(router) {
    router.post('/drinks/create', auth.sessionAuthenticationRequired, drinkController.create);
};

module.exports.connect = connectRoutes;
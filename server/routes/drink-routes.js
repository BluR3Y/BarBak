const drinkController = require('../controllers/drink-controller');
const auth = require('../auth/index');

function connectRoutes(router) {
    router.post('/drinks/create-drink', auth.sessionAuthenticationRequired, drinkController.create_drink);
};

module.exports.connect = connectRoutes;
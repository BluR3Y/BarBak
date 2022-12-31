const drinkController = require('../controllers/drink-controller');
const auth = require('../auth/index');

function connectRoutes(router) {
    router.post('/drinks/create-user-drink', drinkController.create_user_drink);
};

module.exports.connect = connectRoutes;
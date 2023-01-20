const drinkController = require('../controllers/drink-controller');

function connectRoutes(router) {
    router.get('/drinks', drinkController.search);
};

module.exports.connect = connectRoutes;
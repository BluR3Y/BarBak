const drinkController = require('../controllers/drinkware-controller');

function connectRoutes(router) {
    router.get('/drinkware', drinkController.search);
}

module.exports.connect = connectRoutes;
const drinkwareController = require('../controllers/drinkware-controller');
const auth = require('../auth/index');

function connectRoutes(router) {
    router.post('/drinkware/create-drinkware', auth.authenticationRequired, drinkwareController.create_drinkware);
    router.post('/drinkware/search-drinkware', auth.authenticationRequired, drinkwareController.search_drinkware);
}

module.exports.connect = connectRoutes;
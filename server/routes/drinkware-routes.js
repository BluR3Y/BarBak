const drinkwareController = require('../controllers/drinkware-controller');
const auth = require('../auth/index');

function connectRoutes(router) {
    router.post('/drinkware/create-drinkware', auth.authenticationRequired, drinkwareController.create_drinkware);
}

module.exports.connect = connectRoutes;
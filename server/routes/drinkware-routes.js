const drinkwareController = require('../controllers/drinkware-controller');
const auth = require('../auth/index');

function connectRoutes(router) {
    router.post('/drinkware/create-user-drinkware', auth.authenticationRequired, drinkwareController.create_user_drinkware);
}

module.exports.connect = connectRoutes;
const ingredientController = require('../controllers/ingredient-controller');
const auth = require('../auth/index');

function connectRoutes(router) {
    router.post('/ingredients/create', auth.sessionAuthenticationRequired, ingredientController.create);
}

module.exports.connect = connectRoutes;
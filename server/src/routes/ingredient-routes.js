const ingredientController = require('../controllers/ingredient-controller');
const auth = require('../auth/index');

function connectRoutes(router) {
    router.post('/ingredients/create-ingredient', auth.sessionAuthenticationRequired, ingredientController.create_ingredient);
}

module.exports.connect = connectRoutes;
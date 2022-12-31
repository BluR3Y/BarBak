const ingredientController = require('../controllers/ingredient-controller');
const auth = require('../auth/index');

function connectRoutes(router) {
    router.post('/ingredients/create-user-ingredient', auth.authenticationRequired, ingredientController.create_user_ingredient);
}

module.exports.connect = connectRoutes;
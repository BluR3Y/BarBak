const ingredientController = require('../controllers/ingredient-controller');

function connectRoutes(router) {
    router.get('/ingredients', ingredientController.search);
}

module.exports.connect = connectRoutes;
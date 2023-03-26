const ingredientController = require('../controllers/ingredient-controller');


module.exports.connect = function(router) {
    router.post('/ingredients/create', ingredientController.create);

    router.patch('/ingredients/update/info', ingredientController.update);
}
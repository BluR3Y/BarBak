const ingredientController = require('../controllers/ingredient-controller');
const { imageUpload } = require('../config/multer-config');
const joiValidator = require('../middlewares/joi_validator');
const auth = require('../lib/auth');

module.exports.connect = function(router) {
    router.post('/ingredients/:ingredient_type(user|verified)?', ingredientController.create);
    router.post('/ingredients/:ingredient_id/copy', ingredientController.copy);

    router.get('/ingredients/@me', auth.sessionAuthenticationRequired, ingredientController.clientIngredients);
    router.get('/ingredients/search', ingredientController.search);
    router.get('/ingredients/categories', ingredientController.getCategories);
    router.get('/ingredients/:ingredient_id', ingredientController.getIngredient);

    router.patch('/ingredients/:ingredient_id', imageUpload.single('cover'), ingredientController.modify);

    router.delete('/ingredients/:ingredient_id', ingredientController.delete);
}
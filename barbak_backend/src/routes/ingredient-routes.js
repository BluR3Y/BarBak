const ingredientController = require('../controllers/ingredient-controller');
const { imageUpload } = require('../config/multer-config');
const joiValidator = require('../middlewares/joi_validator');
const auth = require('../lib/auth');

module.exports.connect = function(router) {
    router.post('/ingredients/copy/:ingredient_id', ingredientController.copy);
    router.post('/ingredients/:ingredient_type?', ingredientController.create);

    router.get('/ingredients/@me', auth.sessionAuthenticationRequired, ingredientController.clientIngredients);
    router.get('/ingredients/search', ingredientController.search);
    router.get('/ingredients/categories', ingredientController.getCategories);
    router.get('/ingredients/:ingredient_id/:privacy_type?', ingredientController.getIngredient);

    router.patch('/ingredients/cover/upload/:ingredient_id', imageUpload.single('ingredient_cover'), ingredientController.uploadCover);
    router.patch('/ingredients/cover/remove/:ingredient_id', ingredientController.deleteCover);
    router.patch('/ingredients/privacy/:ingredient_id', ingredientController.updatePrivacy);
    router.patch('/ingredients/:ingredient_id', ingredientController.update);

    router.delete('/ingredients/:ingredient_id', ingredientController.delete);
}
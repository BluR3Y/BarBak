const ingredientController = require('../controllers/ingredient-controller');
const { imageUpload } = require('../config/multer-config');
const joiValidator = require('../middlewares/joi_validator');
const auth = require('../lib/auth');

module.exports.connect = function(router) {
    router.post('/ingredients', joiValidator, ingredientController.create);
    router.post('/ingredients/copy/:ingredient_id', joiValidator, ingredientController.copy);

    router.get('/ingredients/@me', auth.sessionAuthenticationRequired, joiValidator, ingredientController.clientIngredients);
    router.get('/ingredients/search', joiValidator, ingredientController.search);
    router.get('/ingredients/:ingredient_id', joiValidator, ingredientController.getIngredient);

    router.patch('/ingredients/info', joiValidator, ingredientController.update);
    router.patch('/ingredients/cover/upload', imageUpload.single('ingredient_cover'), joiValidator, ingredientController.uploadCover);
    router.patch('/ingredients/cover/remove/:ingredient_id', joiValidator, ingredientController.deleteCover);
    router.patch('/ingredients/privacy/:ingredient_id', joiValidator, ingredientController.updatePrivacy);

    router.delete('/ingredients/:ingredient_id', joiValidator, ingredientController.delete);
}
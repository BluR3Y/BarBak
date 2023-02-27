const ingredientController = require('../controllers/ingredient-controller');
const auth = require('../middleware/auth');
const multerConfig = require('../config/multer-config');

function connectRoutes(router) {
    router.post('/ingredients/create', auth.sessionAuthenticationRequired, ingredientController.create);
    router.post('/ingredients/image-upload', auth.sessionAuthenticationRequired, multerConfig.PrivateUpload.single('ingredient_image'), ingredientController.uploadImage);
    router.post('/ingredients/update', auth.sessionAuthenticationRequired, ingredientController.update);
    router.post('/ingredients/delete', auth.sessionAuthenticationRequired, ingredientController.delete);

    router.get('/ingredients/private', auth.sessionAuthenticationRequired, ingredientController.getPrivate);
    router.get('/ingredients/types', ingredientController.getTypes);
    router.get('/ingredients/categories', ingredientController.getCategories);
}

module.exports.connect = connectRoutes;
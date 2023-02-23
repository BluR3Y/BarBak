const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

const ingredientController = require('../controllers/ingredient-controller');
const auth = require('../middleware/auth');

function connectRoutes(router) {
    router.post('/ingredients/create', auth.sessionAuthenticationRequired, ingredientController.create);
    router.post('/ingredients/image-upload', auth.sessionAuthenticationRequired, upload.single('ingredient_image'), ingredientController.uploadImage);
    router.post('/ingredients/update', auth.sessionAuthenticationRequired, ingredientController.update);
    router.post('/ingredients/delete', auth.sessionAuthenticationRequired, ingredientController.delete);

    router.get('/ingredients/private', auth.sessionAuthenticationRequired, ingredientController.getPrivate);
    router.get('/ingredients/types', ingredientController.getTypes);
    router.get('/ingredients/categories', ingredientController.getCategories);
}

module.exports.connect = connectRoutes;
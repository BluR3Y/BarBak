const drinkController = require('../controllers/drink-controller');
const auth = require('../middleware/auth');
const multerConfig = require('../config/multer-config');

function connectRoutes(router) {
    router.post('/drinks/create', auth.sessionAuthenticationRequired, drinkController.create);
    router.post('/drinks/update', auth.sessionAuthenticationRequired, drinkController.update);
    router.post('/drinks/image-upload', auth.sessionAuthenticationRequired,  multerConfig.PrivateUpload.array('drink_image'), drinkController.uploadImage);
    router.post('/drinks/delete', auth.sessionAuthenticationRequired, drinkController.delete);

    router.get('/drinks/preparation-methods', drinkController.getPreparationMethods);
    router.get('/drinks/serving-styles', drinkController.getServingStyles);
    router.get('/drinks/private', auth.sessionAuthenticationRequired, drinkController.getPrivate);
};

module.exports.connect = connectRoutes;
const drinkwareController = require('../controllers/drinkware-controller');
const auth = require('../middleware/auth');
const multerConfig = require('../config/multer-config');

function connectRoutes(router) {
    router.post('/drinkware/create', auth.sessionAuthenticationRequired, drinkwareController.create);
    router.post('/drinkware/image-upload', auth.sessionAuthenticationRequired, multerConfig.PrivateUpload.single('drinkware_image'), drinkwareController.uploadImage);
    router.post('/drinkware/update', auth.sessionAuthenticationRequired, drinkwareController.update);
    // router.post('/drinkware/search', auth.sessionAuthenticationRequired, drinkwareController.search_drinkware);
    router.get('/drinkware/materials', drinkwareController.getMaterials);
    router.get('/drinkware/private', auth.sessionAuthenticationRequired, drinkwareController.getPrivate);
}

module.exports.connect = connectRoutes;
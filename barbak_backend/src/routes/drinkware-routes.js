const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

const drinkwareController = require('../controllers/drinkware-controller');
const auth = require('../middleware/auth');

function connectRoutes(router) {
    router.post('/drinkware/create', auth.sessionAuthenticationRequired, drinkwareController.create);
    router.post('/drinkware/image-upload', auth.sessionAuthenticationRequired, upload.single('drinkware_image'), drinkwareController.uploadImage);
    router.post('/drinkware/update', auth.sessionAuthenticationRequired, drinkwareController.update);
    // router.post('/drinkware/search', auth.sessionAuthenticationRequired, drinkwareController.search_drinkware);
    router.get('/drinkware/materials', drinkwareController.getMaterials);
}

module.exports.connect = connectRoutes;
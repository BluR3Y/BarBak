const multer = require('multer');
const storage = multer.memoryStorage();
const uploads = multer({ storage });

const drinkController = require('../controllers/drink-controller');
const auth = require('../auth/index');

function connectRoutes(router) {
    router.post('/drinks/create', auth.sessionAuthenticationRequired, uploads.array('drinkImage'), drinkController.create);
};

module.exports.connect = connectRoutes;
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

const drinkController = require('../controllers/drink-controller');
const auth = require('../auth/index');

function connectRoutes(router) {
    router.post('/drinks/create', auth.sessionAuthenticationRequired, upload.array('drinkImage'), drinkController.create);
};

module.exports.connect = connectRoutes;
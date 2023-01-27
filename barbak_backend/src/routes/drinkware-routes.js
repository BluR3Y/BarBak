const multer = require('multer');
const storage = multer.memoryStorage();
const uploads = multer({ storage });

const drinkwareController = require('../controllers/drinkware-controller');
const auth = require('../auth/index');

function connectRoutes(router) {
    router.post('/drinkware/create', auth.sessionAuthenticationRequired, uploads.single('drinkwareImage'), drinkwareController.create);
    // router.post('/drinkware/search', auth.sessionAuthenticationRequired, drinkwareController.search_drinkware);
}

module.exports.connect = connectRoutes;
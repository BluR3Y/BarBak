const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

const drinkwareController = require('../controllers/drinkware-controller');
const auth = require('../middleware/auth');

function connectRoutes(router) {
    router.post('/drinkware/create', auth.sessionAuthenticationRequired, upload.single('drinkwareImage'), drinkwareController.create);
    // router.post('/drinkware/search', auth.sessionAuthenticationRequired, drinkwareController.search_drinkware);
}

module.exports.connect = connectRoutes;
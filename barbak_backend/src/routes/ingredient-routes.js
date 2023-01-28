const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

const ingredientController = require('../controllers/ingredient-controller');
const auth = require('../auth/index');

function connectRoutes(router) {
    router.post('/ingredients/create', auth.sessionAuthenticationRequired, upload.single('ingredientImage'), ingredientController.create);
}

module.exports.connect = connectRoutes;
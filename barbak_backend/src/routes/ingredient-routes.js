const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './assets/ingredients/')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const ingredientUploads = multer({ storage });

const ingredientController = require('../controllers/ingredient-controller');
const auth = require('../auth/index');

function connectRoutes(router) {
    router.post('/ingredients/create', auth.sessionAuthenticationRequired, ingredientUploads.single('ingredientImage'), ingredientController.create);
}

module.exports.connect = connectRoutes;
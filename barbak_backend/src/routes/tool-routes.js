const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './assets/tools/')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const toolUploads = multer({ storage });

const toolController = require('../controllers/tool-controller');
const auth = require('../auth/index');

function connectRoutes(router) {
    router.post('/tools/create', auth.sessionAuthenticationRequired, toolUploads.single('toolImage'), toolController.create);
}

module.exports.connect = connectRoutes;
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

const toolController = require('../controllers/tool-controller');
const auth = require('../auth/index');

function connectRoutes(router) {
    router.post('/tools/create', auth.sessionAuthenticationRequired, upload.single('toolImage'), toolController.create);
}

module.exports.connect = connectRoutes;
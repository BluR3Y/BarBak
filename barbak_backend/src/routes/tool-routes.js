const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

const toolController = require('../controllers/tool-controller');
const auth = require('../middleware/auth');

function connectRoutes(router) {
    router.post('/tools/create', auth.sessionAuthenticationRequired, toolController.create);
    router.post('/tools/image-upload', auth.sessionAuthenticationRequired, upload.single('tool_image'), toolController.uploadImage);
    router.post('/tools/update', auth.sessionAuthenticationRequired, toolController.update);
    router.post('/tools/delete', auth.sessionAuthenticationRequired, toolController.delete);

    // router.get('/tools/search', toolController.search);
    router.get('/tools/private', auth.sessionAuthenticationRequired, toolController.getPrivate);
    router.get('/tools/types', toolController.getTypes);
    router.get('/tools/materials', toolController.getMaterials);
}

module.exports.connect = connectRoutes;
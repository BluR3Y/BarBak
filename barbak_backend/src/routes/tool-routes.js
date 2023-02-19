const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

const toolController = require('../controllers/tool-controller');
const auth = require('../auth/index');

function connectRoutes(router) {
    router.post('/tools/create', auth.sessionAuthenticationRequired, upload.single('toolImage'), toolController.create);
    router.post('/tools/submit-publication', auth.sessionAuthenticationRequired, toolController.submitPublication);
    router.post('/tools/validate-publication', auth.sessionAuthenticationRequired, toolController.validatePublication);

    router.get('/tools/search', toolController.search);
    router.get('/tools/private', auth.sessionAuthenticationRequired, toolController.getPrivateTools);
    router.get('/tools/types', toolController.getToolTypes);
    router.get('/tools/materials', toolController.getToolMaterials);
    router.get('/tools/pending-publication', auth.sessionAuthenticationRequired, toolController.getPendingPublications);
}

module.exports.connect = connectRoutes;
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

const toolController = require('../controllers/tool-controller');
const auth = require('../middleware/auth');
const experienceControl = require('../middleware/experience-control');

function connectRoutes(router) {
    router.post('/tools/create', auth.sessionAuthenticationRequired, toolController.create);
    router.post('/tools/image-upload', auth.sessionAuthenticationRequired, upload.single('tool_image'), toolController.uploadToolImage);
    router.post('/tools/submit-publication', auth.sessionAuthenticationRequired, experienceControl.experiencedRequired, toolController.submitPublication);
    router.post('/tools/validate-publication', auth.sessionAuthenticationRequired, experienceControl.expertRequired, toolController.validatePublication);
    router.post('/tools/update', auth.sessionAuthenticationRequired, toolController.update);

    // router.get('/tools/search', toolController.search);
    router.get('/tools/private', auth.sessionAuthenticationRequired, toolController.getPrivateTools);
    router.get('/tools/types', toolController.getToolTypes);
    router.get('/tools/materials', toolController.getToolMaterials);
    router.get('/tools/pending-publication', auth.sessionAuthenticationRequired, experienceControl.expertRequired, toolController.getPendingPublications);
}

module.exports.connect = connectRoutes;
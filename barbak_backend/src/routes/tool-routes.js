const toolController = require('../controllers/tool-controller');
const joiValidator = require('../middlewares/joi_validator');
const { imageUpload } = require('../config/multer-config');
const auth = require('../lib/auth');

module.exports.connect = function(router) {
    router.post('/tools/create', joiValidator, toolController.create);
    router.post('/tools/create/copy/:tool_id', joiValidator, toolController.copy);

    router.get('/tools/search', joiValidator, toolController.search);
    router.get('/tools/@me', auth.sessionAuthenticationRequired, joiValidator, toolController.clientTools);
    router.get('/tools/:tool_id', joiValidator, toolController.getTool);

    router.patch('/tools/update/info', joiValidator, toolController.update);
    router.patch('/tools/update/privacy/:tool_id', joiValidator, toolController.updatePrivacy);
    router.patch('/tools/update/cover/upload', imageUpload.single('tool_cover'), joiValidator, toolController.uploadCover);
    router.patch('/tools/update/cover/remove/:tool_id', joiValidator, toolController.deleteCover);

    router.delete('/tools/delete/:tool_id', joiValidator, toolController.delete);
}
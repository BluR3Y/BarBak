const toolController = require('../controllers/tool-controller');
const joiValidator = require('../middlewares/joi_validator');
const { imageUpload } = require('../config/multer-config');
const auth = require('../lib/auth');

module.exports.connect = function(router) {
    router.post('/tools', joiValidator, toolController.create);
    router.post('/tools/copy/:tool_id', joiValidator, toolController.copy);

    router.get('/tools/search', joiValidator, toolController.search);
    router.get('/tools/@me', auth.sessionAuthenticationRequired, joiValidator, toolController.clientTools);
    router.get('/tools/:tool_id', joiValidator, toolController.getTool);

    router.patch('/tools/info', joiValidator, toolController.update);
    router.patch('/tools/privacy/:tool_id', joiValidator, toolController.updatePrivacy);
    router.patch('/tools/cover/upload', imageUpload.single('tool_cover'), joiValidator, toolController.uploadCover);
    router.patch('/tools/cover/remove/:tool_id', joiValidator, toolController.deleteCover);

    router.delete('/tools/:tool_id', joiValidator, toolController.delete);
}
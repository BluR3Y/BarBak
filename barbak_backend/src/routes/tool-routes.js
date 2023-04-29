const toolController = require('../controllers/tool-controller');
const joiValidator = require('../middlewares/joi_validator');
const { imageUpload } = require('../config/multer-config');
const auth = require('../lib/auth');

module.exports.connect = function(router) {
    router.post('/tools/:tool_type?', toolController.create);
    router.post('/tools/copy/:tool_id', toolController.copy);

    router.get('/tools/search', toolController.search);
    router.get('/tools/@me', auth.sessionAuthenticationRequired, toolController.clientTools);
    router.get('/tools/categories', toolController.getCategories);
    router.get('/tools/:tool_id/cover', toolController.getCover);
    router.get('/tools/:tool_id/:privacy_type?', toolController.getTool);

    router.patch('/tools/privacy/:tool_id', toolController.updatePrivacy);
    router.patch('/tools/cover/upload/:tool_id', imageUpload.single('tool_cover'), toolController.uploadCover);
    router.patch('/tools/cover/remove/:tool_id', toolController.deleteCover);
    router.patch('/tools/:tool_id', toolController.update);

    router.delete('/tools/:tool_id', toolController.delete);
}
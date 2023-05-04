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
    router.get('/tools/:tool_id', toolController.getTool);

    router.patch('/tools/:tool_id', imageUpload.single('cover'), toolController.modify);

    router.delete('/tools/:tool_id', toolController.delete);
}
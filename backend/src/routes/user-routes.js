const userController = require('../controllers/user-controller');
const { imageUpload } = require('../config/multer-config');
const auth = require('../lib/auth');
const validator = require('../middlewares/validator');

module.exports.connect = function(router) {
    router.get('/users/@me', auth.sessionAuthenticationRequired, userController.getClientInfo);
    router.get('/users/:user_id', validator, userController.getUser);
    router.patch('/users/@me', auth.sessionAuthenticationRequired, imageUpload.single('profile_image'), validator, userController.modifyClientInfo);
};
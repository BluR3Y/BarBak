const userController = require('../controllers/user-controller');
const { imageUpload } = require('../config/multer-config');
const auth = require('../lib/auth');
const joiValidator = require('../middleware/joi_validator');

module.exports.connect = function(router) {
    router.get('/users/@me', auth.sessionAuthenticationRequired, userController.clientInfo);
    router.get('/users/:user_id', joiValidator, userController.getUser);

    router.patch('/users/profile-image/upload', imageUpload.single('profile_image'), userController.uploadProfileImage);
    router.patch('/users/profile-image/remove', userController.removeProfileImage);
    router.patch('/users/username', joiValidator, userController.changeUsername);
}
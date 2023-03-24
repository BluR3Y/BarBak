const userController = require('../controllers/user-controller');
const { imageUpload } = require('../config/multer-config');
const auth = require('../auth');
const joiValidator = require('../middlewares/joi_validator');

module.exports.connect = function(router) {
    router.get('/users/@me', auth.sessionAuthenticationRequired, userController.clientInfo);
    router.get('/users/:user_id', joiValidator, userController.getUser);

    router.patch('/users/update/profile-image/upload', imageUpload.single('profile_image'), userController.uploadProfileImage);
    router.patch('/users/update/profile-image/remove', userController.removeProfileImage);
    router.patch('/users/update/username', joiValidator, userController.changeUsername);
}
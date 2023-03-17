const userController = require('../controllers/user-controller');
const multerConfig = require('../config/multer-config');
const auth = require('../auth');

module.exports.connect = function(router) {
    router.get('/users/@me', auth.sessionAuthenticationRequired, userController.clientInfo);
    router.get('/users/:user_id', userController.getUser);

    router.patch('/users/update/profile-image/upload', multerConfig.single('profile_image'), userController.uploadProfileImage);
    router.patch('/users/update/profile-image/remove', userController.removeProfileImage);
    router.patch('/users/update/username', userController.changeUsername);
}
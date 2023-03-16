const userController = require('../controllers/user-controller');
const multerConfig = require('../config/multer-config');
const auth = require('../auth');

module.exports.connect = function(router) {
    router.get('/users/@me', auth.sessionAuthenticationRequired, userController.clientInfo);
    router.get('/users/:user_id', userController.getUser);

    router.put('/users/update/profile-image', multerConfig.PublicUpload.single('profile_image'), userController.uploadProfileImage);
    router.put('/users/update/username', userController.changeUsername);
}
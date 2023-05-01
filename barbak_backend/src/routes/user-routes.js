const userController = require('../controllers/user-controller');
const { imageUpload } = require('../config/multer-config');
const auth = require('../lib/auth');
const joiValidator = require('../middlewares/joi_validator');

// module.exports.connect = function(router) {
//     router.get('/users/@me', auth.sessionAuthenticationRequired, userController.clientInfo);
//     router.get('/users/:user_id/:privacy_type?', userController.getUser);

//     router.patch('/users/profile-image/upload', imageUpload.single('profile_image'), userController.uploadProfileImage);
//     router.patch('/users/profile-image/remove', userController.removeProfileImage);
//     router.patch('/users/username', userController.changeUsername);
// }

module.exports.connect = function(router) {
    router.get('/users/@me', auth.sessionAuthenticationRequired, userController.getClientInfo);
    router.get('/users/:user_id/profile-image', userController.getProfileImage);
    router.get('/users/:user_id', userController.getUser);

    router.patch('/users/@me', auth.sessionAuthenticationRequired, imageUpload.single('profile_image'), userController.modifyClientInfo);
};
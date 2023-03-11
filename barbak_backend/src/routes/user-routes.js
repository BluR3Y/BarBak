const userController = require('../controllers/user-controller');
const multerConfig = require('../config/multer-config');

module.exports.connect = function(router) {
    router.get('/users/:user_id', userController.getUser);

    router.put('/users/upload-profile-image',multerConfig.PublicUpload.single('profile_image'), userController.uploadProfileImage);
}
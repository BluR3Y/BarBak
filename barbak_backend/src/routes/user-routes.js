const userController = require('../controllers/user-controller');
const auth = require('../middleware/auth');
const multerConfig = require('../config/multer-config');

function connectRoutes(router) {
    // router.post('/test', userController.test);
    // router.get('/getTest', auth.sessionAuthenticationRequired, userController.test);
    // // router.post('/testupload', userUploads.single('testImage'), userController.testUploads);
    // router.post('/get-image', userController.testDownloads);
    // router.get('/test-nodemailer', userController.testNodeMailer);
    // router.post('/users/register', upload.single('profileImage'), userController.register);
    router.get('/test-acl', userController.testACL);

    
    router.post('/users/register', userController.register);
    router.post('/users/register/verify', userController.validateRegistrationCode);
    router.get('/users/register/resend', userController.resendRegistrationCode);
    router.post('/users/register/username', userController.usernameSelection);

    router.post('/users/login', userController.login);
    router.get('/users/check-session', userController.checkSession);
    router.get('/users/logout', auth.sessionAuthenticationRequired, userController.logout);
    router.post('/users/upload-profile-image', auth.sessionAuthenticationRequired, multerConfig.PublicUpload.single('profile_image'), userController.uploadProfileImage);
};

module.exports.connect = connectRoutes;
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

const userController = require('../controllers/user-controller');
const auth = require('../auth/index');


function connectRoutes(router) {
    router.post('/test', userController.test);
    router.get('/getTest', auth.sessionAuthenticationRequired, userController.test);
    // router.post('/testupload', userUploads.single('testImage'), userController.testUploads);
    router.post('/get-image', userController.testDownloads);
    router.get('/test-nodemailer', userController.testNodeMailer);

    router.post('/users/register', upload.single('profileImage'), userController.register);
    router.post('/users/login', userController.login);
    router.get('/users/check-session', userController.checkSession);
    router.get('/users/logout', auth.sessionAuthenticationRequired, userController.logout);
};

module.exports.connect = connectRoutes;
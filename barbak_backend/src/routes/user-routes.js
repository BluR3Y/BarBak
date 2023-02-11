const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

const userController = require('../controllers/user-controller');
const auth = require('../auth/index');


function connectRoutes(router) {
    router.post('/test', userController.test);
    router.get('/getTest', userController.test);
    // router.post('/testupload', userUploads.single('testImage'), userController.testUploads);

    router.post('/users/register', upload.single('profileImage'), userController.register);
    router.post('/users/login', userController.login);
    router.get('/users/logout', auth.sessionAuthenticationRequired, userController.logout);
};

module.exports.connect = connectRoutes;
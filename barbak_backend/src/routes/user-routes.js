const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './assets/users/')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const userUploads = multer({ storage });

const userController = require('../controllers/user-controller');
const auth = require('../auth/index');


function connectRoutes(router) {
    router.post('/test', userController.test);
    router.get('/getTest', userController.test);
    router.post('/testupload', userUploads.single('testImage'), userController.testUploads);

    router.post('/users/register', userUploads.single('profileImage'), userController.register);
    router.post('/users/login', userController.login);
    router.get('/users/logout', auth.sessionAuthenticationRequired, userController.logout);
};

module.exports.connect = connectRoutes;
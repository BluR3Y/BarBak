const userController = require('../controllers/user-controller');
const auth = require('../auth/index');

function connectRoutes(router) {
    router.post('/test', auth.authenticationRequired, userController.test);
    router.post('/users/register', userController.register);
    router.post('/users/login', userController.login);
};

module.exports.connect = connectRoutes;
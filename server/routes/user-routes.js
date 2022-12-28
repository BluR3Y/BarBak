const userController = require('../controllers/user-controller');

function connectRoutes(router) {
    router.post('/users/register', userController.register);
    router.post('/users/login', userController.login);
};

module.exports.connect = connectRoutes;
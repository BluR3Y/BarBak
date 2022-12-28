const userController = require('../controllers/user-controller');

function connectRoutes(router) {
    router.post('/test', userController.test);
    router.post('/register', userController.register);
};

module.exports.connect = connectRoutes;
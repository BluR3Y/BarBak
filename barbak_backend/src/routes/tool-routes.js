const toolController = require('../controllers/tool-controller');
const auth = require('../auth/index');

function connectRoutes(router) {
    router.post('/tools/create', auth.sessionAuthenticationRequired, toolController.create);
}

module.exports.connect = connectRoutes;
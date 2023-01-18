const toolController = require('../controllers/tool-controller');
const auth = require('../auth/index');

function connectRoutes(router) {
    router.post('/tools/create-tool', auth.sessionAuthenticationRequired, toolController.create_tool);
}

module.exports.connect = connectRoutes;
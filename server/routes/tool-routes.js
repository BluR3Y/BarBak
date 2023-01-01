const toolController = require('../controllers/tool-controller');
const auth = require('../auth/index');

function connectRoutes(router) {
    router.post('/tools/create-tool', auth.authenticationRequired, toolController.create_tool);
}

module.exports.connect = connectRoutes;
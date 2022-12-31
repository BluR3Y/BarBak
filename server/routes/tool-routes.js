const toolController = require('../controllers/tool-controller');
const auth = require('../auth/index');

function connectRoutes(router) {
    router.post('/tools/create-user-tool', auth.authenticationRequired, toolController.create_user_tool);
}

module.exports.connect = connectRoutes;
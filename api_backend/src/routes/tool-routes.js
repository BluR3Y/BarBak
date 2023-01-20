const toolController = require('../controllers/tool-controller');

function connectRoutes(router) {
    router.get('/tools', toolController.search);
}

module.exports.connect = connectRoutes;
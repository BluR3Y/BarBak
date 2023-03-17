const toolController = require('../controllers/tool-controller');


module.exports.connect = function(router) {
    router.post('/tools/create', toolController.createUser);
    router.post('/content/create/verified/tools', toolController.createVerified);
}
const assetController = require('../controllers/asset-controller');

function connectRoutes(router) {
    router.get('/assets/:filename', assetController.getFile);
};

module.exports.connect = connectRoutes;
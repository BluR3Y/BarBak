const mediaController = require('../controllers/media-controller');
const auth = require('../middleware/auth');

function connectRoutes(router) {
    router.get('/search', mediaController.search);
}
module.exports.connect = connectRoutes;
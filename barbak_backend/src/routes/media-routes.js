const mediaControllers = require('../controllers/media-controller');

module.exports.connect = function(router) {
    router.use('/embeded', mediaControllers.embeded);
    router.get('/:resource_type/:document_id/cover', mediaControllers.resourceCover);
};
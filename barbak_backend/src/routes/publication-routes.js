const publicationController = require('../controllers/publication-controller');
const auth = require('../middleware/auth');
const experienceControl = require('../middleware/experience-control');

function connectRoutes(router) {
    // router.post('/publication/submit', auth.sessionAuthenticationRequired, experienceControl.experiencedRequired, publicationController.submit);
    router.post('/publication/publish-tool', auth.sessionAuthenticationRequired, experienceControl.experiencedRequired, publicationController.publishTool);
    router.post('/publication/validate', auth.sessionAuthenticationRequired, experienceControl.expertRequired, publicationController.validate);
    
    router.get('/publication/pending', auth.sessionAuthenticationRequired, experienceControl.expertRequired, publicationController.pending);
}
module.exports.connect = connectRoutes;
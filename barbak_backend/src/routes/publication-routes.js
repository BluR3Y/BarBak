const publicationController = require('../controllers/publication-controller');
const auth = require('../middleware/auth');
const experienceControl = require('../middleware/experience-control');

function connectRoutes(router) {
    router.post('/publication/publish-tool', auth.sessionAuthenticationRequired, experienceControl.experiencedRequired, publicationController.publishTool);
    router.post('/publication/publish-drinkware', auth.sessionAuthenticationRequired, experienceControl.experiencedRequired, publicationController.publishDrinkware);
    router.post('/publication/publish-ingredient', auth.sessionAuthenticationRequired, experienceControl.experiencedRequired, publicationController.publishIngredient);
    router.post('/publication/publish-drink', auth.sessionAuthenticationRequired, experienceControl.experiencedRequired, publicationController.publishDrink);
    router.post('/publication/validate', auth.sessionAuthenticationRequired, experienceControl.expertRequired, publicationController.validate);
    
    router.get('/publication/pending', auth.sessionAuthenticationRequired, experienceControl.expertRequired, publicationController.pending);
    router.get('/publication/test', auth.sessionAuthenticationRequired, publicationController.tester);
}
module.exports.connect = connectRoutes;
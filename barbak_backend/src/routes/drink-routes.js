const drinkController = require('../controllers/drink-controller');
const { imageUpload } = require('../config/multer-config');

module.exports.connect = function(router) {
    router.post('/drinks/:drink_type(user|verified)?', drinkController.create);
    router.post('/drinks/:drink_id/copy', drinkController.copy);
    
    router.get('/drinks/@me', drinkController.clientDrinks);
    router.get('/drinks/search', drinkController.search);
    router.get('/drinks/preparation-methods', drinkController.getPreparationMethods);
    router.get('/drinks/serving-styles', drinkController.getServingStyles);
    router.get('/drinks/:drink_id', drinkController.getDrink);

    router.patch('/drinks/:drink_id', imageUpload.fields([
        { name: 'cover', maxCount: 1 },
        { name: 'gallery', maxCount: 10 }
    ]), drinkController.modify);

    router.delete('/drinks/:drink_id', drinkController.delete);
}
const drinkController = require('../controllers/drink-controller');
const { imageUpload } = require('../config/multer-config');

module.exports.connect = function(router) {
    router.post('/drinks/:drink_type?', drinkController.create);
    router.post('/drinks/copy/:drink_id', drinkController.copy);

    router.get('/drinks/@me', drinkController.clientDrinks);
    router.get('/drinks/search', drinkController.search);
    router.get('/drinks/preparation-methods', drinkController.getPreparationMethods);
    router.get('/drinks/serving-styles', drinkController.getServingStyles);
    router.get('/drinks/:drink_id/:privacy_type?', drinkController.getDrink);

    router.put('/drinks/:drink_id', drinkController.update);

    router.patch('/drinks/privacy/:drink_id', drinkController.updatePrivacy);
    router.patch('/drinks/gallery/upload/:drink_id', imageUpload.array('gallery_image', 10), drinkController.uploadGallery);
    router.patch('/drinks/gallery/remove/:drink_id', drinkController.removeGallery);

    router.delete('/drinks/:drink_id', drinkController.delete);
}
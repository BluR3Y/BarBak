const drinkController = require('../controllers/drink-controller');
const { imageUpload } = require('../config/multer-config');
const validator = require('../middlewares/validator');

module.exports.connect = function(router) {
    router.post('/drinks/:drink_id/copy', validator, drinkController.copyDrink);
    router.post('/drinks/:drink_id/gallery', imageUpload.array('gallery', 10), validator, drinkController.galleryUpload);
    router.post('/drinks/:drink_id/ingredients', validator, drinkController.createIngredient);
    router.post('/drinks/:drink_id/tools/:tool_id', validator, drinkController.createTool);
    router.post('/drinks/:drink_type(user|verified)?', validator, drinkController.createDrink);

    router.get('/drinks/@me', validator, drinkController.clientDrinks);
    router.get('/drinks/search', validator, drinkController.search);
    router.get('/drinks/preparation-methods', drinkController.getPreparationMethods);
    router.get('/drinks/serving-styles', drinkController.getServingStyles);
    router.get('/drinks/:drink_id', validator, drinkController.getDrink);

    router.patch('/drinks/:drink_id/ingredients/:ingredient_id', validator, drinkController.modifyIngredient);
    router.patch('/drinks/:drink_id', imageUpload.single('cover'), validator, drinkController.modifyDocument);

    router.delete('/drinks/:drink_id/gallery/:image_id', validator, drinkController.galleryRemoval);
    router.delete('/drinks/:drink_id/ingredients/:ingredient_id', validator, drinkController.deleteIngredient);
    router.delete('/drinks/:drink_id/tools/:tool_id', validator, drinkController.deleteTool);
    router.delete('/drinks/:drink_id', validator, drinkController.deleteDrink);
}
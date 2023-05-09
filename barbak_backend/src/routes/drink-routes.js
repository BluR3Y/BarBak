const drinkController = require('../controllers/drink-controller');
const { imageUpload } = require('../config/multer-config');

module.exports.connect = function(router) {
    router.post('/drinks/:drink_id/copy', drinkController.copyDrink);
    router.post('/drinks/:drink_id/gallery', imageUpload.array('gallery', 10), drinkController.galleryUpload);
    router.post('/drinks/:drink_id/ingredients', drinkController.createIngredient);
    router.post('/drinks/:drink_id/tools/:tool_id', drinkController.createTool);
    router.post('/drinks/:drink_type(user|verified)?', drinkController.createDrink);

    router.get('/drinks/@me', drinkController.clientDrinks);
    router.get('/drinks/search', drinkController.search);
    router.get('/drinks/preparation-methods', drinkController.getPreparationMethods);
    router.get('/drinks/serving-styles', drinkController.getServingStyles);
    router.get('/drinks/:drink_id', drinkController.getDrink);

    router.patch('/drinks/:drink_id/ingredients/:ingredient_id', drinkController.modifyIngredient);
    router.patch('/drinks/:drink_id', imageUpload.single('cover'), drinkController.modifyDocument);

    router.delete('/drinks/:drink_id/gallery/:image_id', drinkController.galleryRemoval);
    router.delete('/drinks/:drink_id/ingredients/:ingredient_id', drinkController.deleteIngredient);
    router.delete('/drinks/:drink_id/tools/:tool_id', drinkController.deleteTool);
    router.delete('/drinks/:drink_id', drinkController.deleteDrink);
}
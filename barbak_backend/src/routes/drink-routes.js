const drinkController = require('../controllers/drink-controller');

module.exports.connect = function(router) {
    router.post('/drinks/:drink_type?', drinkController.create);

    router.get('/drinks/@me', drinkController.clientDrinks);
    router.get('/drinks/:drink_id', drinkController.getDrink);

    router.patch('/drinks/:drink_id', drinkController.update);
    // router.patch('/drinks/cover/upload/:drink_id', drinkController.uploadCover);
}
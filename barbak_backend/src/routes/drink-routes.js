const drinkController = require('../controllers/drink-controller');

module.exports.connect = function(router) {
    router.post('/drinks', drinkController.create);
}
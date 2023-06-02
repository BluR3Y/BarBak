const drinkwareController = require('../controllers/drinkware-controller');
const { imageUpload } = require('../config/multer-config');
const validator = require('../middlewares/validator');
const auth = require('../lib/auth');

module.exports.connect = function(router) {
    router.post('/drinkware/:drinkware_type(user|verified)?', drinkwareController.create);
    router.post('/drinkware/:drinkware_id/copy', drinkwareController.copy);

    router.get('/drinkware/@me', auth.sessionAuthenticationRequired, drinkwareController.clientDrinkware);
    router.get('/drinkware/search', drinkwareController.search);
    router.get('/drinkware/:drinkware_id', drinkwareController.getDrinkware);

    router.patch('/drinkware/:drinkware_id', imageUpload.single('cover'), drinkwareController.modify);

    router.delete('/drinkware/:drinkware_id', drinkwareController.delete);
}
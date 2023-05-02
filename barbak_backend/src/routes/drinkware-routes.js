const drinkwareController = require('../controllers/drinkware-controller');
const { imageUpload } = require('../config/multer-config');
const joiValidator = require('../middlewares/joi_validator');
const auth = require('../lib/auth');

module.exports.connect = function(router) {
    router.post('/drinkware/:drinkware_type?', drinkwareController.create);
    router.post('/drinkware/copy/:drinkware_id', drinkwareController.copy);

    router.get('/drinkware/@me', auth.sessionAuthenticationRequired, drinkwareController.clientDrinkware);
    router.get('/drinkware/search', drinkwareController.search);
    router.get('/drinkware/:drinkware_id', drinkwareController.getDrinkware);

    router.patch('/drinkware/:drinkware_id', imageUpload.single('cover'), drinkwareController.modify);

    router.delete('/drinkware/:drinkware_id', drinkwareController.delete);
}
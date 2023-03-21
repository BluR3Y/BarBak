const drinkwareController = require('../controllers/drinkware-controller');
const multerConfig = require('../config/multer-config');
const joiValidator = require('../middlewares/joi_validator');
const auth = require('../auth');

module.exports.connect = function(router) {
    router.post('/drinkware/create', joiValidator, drinkwareController.create);
    router.post('/drinkware/copy/:drinkware_id', joiValidator, drinkwareController.copy);

    router.get('/drinkware/search', joiValidator, drinkwareController.search);
    router.get('/drinkware/@me', auth.sessionAuthenticationRequired, drinkwareController.clientDrinkware);
    router.get('/drinkware/:drinkware_id', joiValidator, drinkwareController.getDrinkware);

    router.patch('/drinkware/update/cover/upload', multerConfig.single('drinkware_cover'), joiValidator, drinkwareController.uploadCover);
    router.patch('/drinkware/update/cover/remove/:drinkware_id', joiValidator, drinkwareController.deleteCover);
    router.patch('/drinkware/update/info', joiValidator, drinkwareController.update);
    router.patch('/drinkware/update/privacy/:drinkware_id', joiValidator, drinkwareController.updatePrivacy);

    router.delete('/drinkware/delete/:drinkware_id', joiValidator, drinkwareController.delete);
}
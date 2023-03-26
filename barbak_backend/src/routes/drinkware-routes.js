const drinkwareController = require('../controllers/drinkware-controller');
const { imageUpload } = require('../config/multer-config');
const joiValidator = require('../middlewares/joi_validator');
const auth = require('../lib/auth');

module.exports.connect = function(router) {
    router.post('/drinkware', joiValidator, drinkwareController.create);
    router.post('/drinkware/copy/:drinkware_id', joiValidator, drinkwareController.copy);

    router.get('/drinkware/search', joiValidator, drinkwareController.search);
    router.get('/drinkware/@me', auth.sessionAuthenticationRequired, joiValidator, drinkwareController.clientDrinkware);
    router.get('/drinkware/:drinkware_id', joiValidator, drinkwareController.getDrinkware);

    router.patch('/drinkware/cover/upload', imageUpload.single('drinkware_cover'), joiValidator, drinkwareController.uploadCover);
    router.patch('/drinkware/cover/remove/:drinkware_id', joiValidator, drinkwareController.deleteCover);
    router.patch('/drinkware/info', joiValidator, drinkwareController.update);
    router.patch('/drinkware/privacy/:drinkware_id', joiValidator, drinkwareController.updatePrivacy);

    router.delete('/drinkware/:drinkware_id', joiValidator, drinkwareController.delete);
}
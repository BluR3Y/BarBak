const drinkwareController = require('../controllers/drinkware-controller');
const { imageUpload } = require('../config/multer-config');
const joiValidator = require('../middlewares/joi_validator');
const auth = require('../lib/auth');

module.exports.connect = function(router) {
    router.post('/drinkware/:drinkware_type?', joiValidator, drinkwareController.create);
    router.post('/drinkware/copy/:drinkware_id', joiValidator, drinkwareController.copy);

    router.get('/drinkware/@me', auth.sessionAuthenticationRequired, joiValidator, drinkwareController.clientDrinkware);
    router.get('/drinkware/search', joiValidator, drinkwareController.search);
    router.get('/drinkware/:drinkware_id/:privacy?', joiValidator, drinkwareController.getDrinkware);

    router.patch('/drinkware/cover/upload/:drinkware_id', imageUpload.single('drinkware_cover'), joiValidator, drinkwareController.uploadCover);
    router.patch('/drinkware/cover/remove/:drinkware_id', joiValidator, drinkwareController.deleteCover);
    router.patch('/drinkware/privacy/:drinkware_id', joiValidator, drinkwareController.updatePrivacy);
    router.patch('/drinkware/:drinkware_id', joiValidator, drinkwareController.update);

    router.delete('/drinkware/:drinkware_id', joiValidator, drinkwareController.delete);
}
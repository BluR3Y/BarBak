const drinkwareController = require('../controllers/drinkware-controller');
const { imageUpload } = require('../config/multer-config');
const joiValidator = require('../middlewares/joi_validator');
const auth = require('../lib/auth');

module.exports.connect = function(router) {
    router.post('/drinkware/:drinkware_type?', drinkwareController.create);
    router.post('/drinkware/copy/:drinkware_id', drinkwareController.copy);

    router.get('/drinkware/@me', auth.sessionAuthenticationRequired, drinkwareController.clientDrinkware);
    router.get('/drinkware/search', drinkwareController.search);
    router.get('/drinkware/:drinkware_id/:privacy_type?', drinkwareController.getDrinkware);

    router.patch('/drinkware/cover/upload/:drinkware_id', imageUpload.single('drinkware_cover'), drinkwareController.uploadCover);
    router.patch('/drinkware/cover/remove/:drinkware_id', drinkwareController.deleteCover);
    router.patch('/drinkware/privacy/:drinkware_id', drinkwareController.updatePrivacy);
    router.patch('/drinkware/:drinkware_id', drinkwareController.update);

    router.delete('/drinkware/:drinkware_id', drinkwareController.delete);
}
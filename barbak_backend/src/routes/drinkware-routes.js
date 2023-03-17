const drinkwareController = require('../controllers/drinkware-controller');
const multerConfig = require('../config/multer-config');
const auth = require('../auth');

module.exports.connect = function(router) {
    router.post('/drinkware/create', drinkwareController.create);
    router.post('/drinkware/copy/:drinkware_id', drinkwareController.copy);

    router.get('/drinkware/search', drinkwareController.search);
    router.get('/drinkware/@me', auth.sessionAuthenticationRequired, drinkwareController.clientDrinkware);
    router.get('/drinkware/:drinkware_id', drinkwareController.getDrinkware);

    router.patch('/drinkware/update/cover/upload', multerConfig.single('drinkware_cover'), drinkwareController.uploadCover);
    router.patch('/drinkware/update/cover/remove/:drinkware_id', drinkwareController.deleteCover);
    router.patch('/drinkware/update/info', drinkwareController.update);
    router.patch('/drinkware/update/privacy/:drinkware_id', drinkwareController.updatePrivacy);

    router.delete('/drinkware/delete/:drinkware_id', drinkwareController.delete);
}
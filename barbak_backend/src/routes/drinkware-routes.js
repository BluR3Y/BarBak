const drinkwareController = require('../controllers/drinkware-controller');
const multerConfig = require('../config/multer-config');
const auth = require('../auth');

module.exports.connect = function(router) {
    router.post('/drinkware/create', drinkwareController.create);
    router.post('/content/verified-drinkware', drinkwareController.createVerified);
    
    router.get('/drinkware/search', drinkwareController.search);
    router.get('/drinkware/@me', auth.sessionAuthenticationRequired, drinkwareController.clientDrinkware);
    router.get('/drinkware/:drinkware_id', drinkwareController.getDrinkware);

    router.put('/drinkware/update/cover', multerConfig.PrivateUpload.single('drinkware_cover'), drinkwareController.uploadCover);
    router.put('/drinkware/update/info', drinkwareController.update);
    router.put('/drinkware/update/privacy/:drinkware_id', drinkwareController.updatePrivacy);

    router.delete('/drinkware/delete/:drinkware_id', drinkwareController.delete);
}
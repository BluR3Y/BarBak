const accountController = require('../controllers/account-controller');
const validator = require('../middlewares/validator');

module.exports.connect = function(router) {
    router.post('/accounts/login', validator, accountController.login);

    router.post('/accounts/register', validator, accountController.register);
    router.post('/accounts/register/resend', accountController.resendRegistrationCode);
    router.post('/accounts/register/validate/:registration_code', validator, accountController.validateRegistrationCode);
    router.post('/accounts/register/username', validator, accountController.usernameSelection);

    router.patch('/accounts/privacy', accountController.togglePrivacy);

    router.delete('/accounts/logout', accountController.logout);
};
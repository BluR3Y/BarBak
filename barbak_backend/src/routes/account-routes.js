const accountController = require('../controllers/account-controller');
const joiValidator = require('../middleware/joi_validator');

module.exports.connect = function(router) {
    router.post('/accounts/login', accountController.login);

    router.post('/accounts/register', accountController.register);
    router.post('/accounts/register/resend', accountController.resendRegistrationCode);
    router.post('/accounts/register/validate/:registration_code', accountController.validateRegistrationCode);
    router.post('/accounts/register/username', accountController.usernameSelection);

    router.patch('/accounts/privacy', accountController.togglePrivacy);

    router.delete('/accounts/logout', accountController.logout);
};
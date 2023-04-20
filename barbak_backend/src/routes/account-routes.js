const accountController = require('../controllers/account-controller');
const joiValidator = require('../middleware/joi_validator');

module.exports.connect = function(router) {
    router.post('/account/login', joiValidator, accountController.login);

    router.post('/account/register', joiValidator, accountController.register);
    router.post('/account/register/resend', accountController.resendRegistrationCode);
    router.post('/account/register/validate/:registration_code', joiValidator, accountController.validateRegistrationCode);
    router.post('/account/register/username', joiValidator, accountController.usernameSelection);

    router.patch('/account/privacy', accountController.togglePrivacy);

    router.delete('/account/logout', accountController.logout);
};
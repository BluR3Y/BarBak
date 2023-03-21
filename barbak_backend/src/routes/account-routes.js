const accountController = require('../controllers/account-controller');
const joiValidator = require('../middlewares/joi_validator');

module.exports.connect = function(router) {
    router.post('/account/login', joiValidator, accountController.login);
    router.delete('/account/logout', accountController.logout);
    router.put('/account/privacy', accountController.togglePrivacy);

    router.post('/account/register', joiValidator, accountController.register);
    router.post('/account/register/resend', accountController.resendRegistrationCode);
    router.post('/account/register/validate', joiValidator, accountController.validateRegistrationCode);
    router.post('/account/register/username', joiValidator, accountController.usernameSelection);
};
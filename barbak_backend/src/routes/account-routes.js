const accountController = require('../controllers/account-controller');

module.exports.connect = function(router) {
    router.post('/account/login', accountController.login);
    router.delete('/account/logout', accountController.logout);

    router.post('/account/register', accountController.register);
    router.post('/account/register/resend', accountController.resendRegistrationCode);
    router.post('/account/register/validate', accountController.validateRegistrationCode);
    router.post('/account/register/username', accountController.usernameSelection);
};
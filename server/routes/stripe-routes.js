const stripeController = require('../controllers/stripe-controller');

function connectRoutes(router) {
    router.post('/stripe-checkout', stripeController.checkout);
    router.post('/stripe-webhooks', stripeController.webhooks);
}

module.exports.connect = connectRoutes;
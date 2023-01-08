const stripe = require('stripe')('sk_test_51MNsJTLzZQGiyLlFvKlgkERFIsh2JwMaFe4kGDIQ112MCNxNrd6O9SiFqSz2mmYaqqFSCepa5gUmvWuoRRA8LWCS00hczNfNlE');
const endpointSecret = process.env.STRIPE_END_POINT_SECRET;
const APIKey = require('../models/apiKey-model');
const Customer = require('../models/customer-model');

module.exports.checkout = async (req, res) => {
    const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
            {
                price: 'price_1MNsdBLzZQGiyLlF9n2ZO8DM',
                quantity: '1'
            },
        ],
        success_url: 'https://google.com/success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'http://localhost:5000/error',
    });
    res.send(session);
}

module.exports.webhooks = async (req, res) => {
    const signature = req.headers['stripe-signature'];
    let data;
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            endpointSecret
        );
        data = event.data;
    } catch (err) {
        console.log(`Error message: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch(event.type) {
        case 'checkout.session.completed':
            const customerId = data.object.customer;
            const subscriptionId = data.object.subscription;

            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const itemId = subscription.items.data[0].id;

            var { apiKey, hashedAPIKey } = await APIKey.generateAPIKey();
            
            try {
                await Customer.create({
                    customerId,
                    apiKey: hashedAPIKey,
                    itemId,
                    active: true,
                });
                await APIKey.create({
                    hashedAPIKey: customerId
                });
            } catch (err) {

            }

            break;
        case 'invoice.paid':
            break;
        case 'invoice.payment_failed':

        default:
            // console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
}
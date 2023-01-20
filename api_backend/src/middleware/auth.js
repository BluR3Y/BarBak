const Developer = require('../models/developer-model');

// Middleware that checks if API key is valid
exports.keyAuthenticationRequired = async function(req, res, next) {
    const apiKey = req.query.key;

    if(!apiKey)
        return res.status(401).send('Not Authenticated');

    const hashedKey = Developer.hashAPIKey(apiKey);
    const developer = await Developer.findOne({ apiKey: hashedKey });

    if(!developer) 
        return res.status(401).send('Not Authenticated');
    // if(await developer.exceedsSubscriptionCallLimit())
    //     return res.status(400).send('Subscription Limit Exceeded');

    try {
        developer.createCallLog();
    } catch(err) {
        return res.status(500).send();
    }
    next();
}
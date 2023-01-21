const _ = require('lodash');
const Developer = require('../models/developer-model');

// Middleware that checks if API key is valid
exports.keyAuthenticationRequired = async (req, res, next) => {
        // const host = req.get('host');
    // const origin = req.get('origin');
    const validRequestMethods = ['POST','GET'];
    const requestMethod = req.method;

    if(!_.includes(validRequestMethods, requestMethod)) 
        return res.status(400).send('Invalid Request Method');
    
    const apiKey = (requestMethod === 'POST') ? req.body.key : req.query.key;

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
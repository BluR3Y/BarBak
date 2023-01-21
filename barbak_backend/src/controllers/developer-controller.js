const Developer = require('../models/developer-model');

module.exports.register = async (req, res) => {
    const { name, email, link, statement } = req.body;

    if(await Developer.findOne({ email }))
        return res.status(400).send({ path: 'email', type: 'exist' });
    else if(await Developer.findOne({ link }))
        return res.status(400).send({ path: 'link', type: 'exist' });
    
    const { apiKey, hashedAPIKey } = await Developer.generateAPIKey();

    try {
        await Developer.create({
            name,
            email,
            link,
            statement,
            apiKey: hashedAPIKey,
            user: req.user
        });
    } catch(err) {
        return res.status(500).send(err);
    }
    res.status(200).send({ apiKey });
}

module.exports.regenerateAPIKey = async (req, res) => {
    const developer = await Developer.findOne({ user: req.user });

    if(!developer)
        return res.status(401).send({ path: 'developer', type: 'registered' });

    const { apiKey, hashedAPIKey } = await Developer.generateAPIKey();

    try {
        await developer.updateOne({
            apiKey: hashedAPIKey
        });
    } catch(err) {
        return res.status(500).send(err);
    }
    res.status(200).send({ apiKey });
}

module.exports.updateInfo = async (req, res) => {
    const { name, email, link, statement } = req.body;
    const developer = await Developer.findOne({ user: req.user });

    if(!developer)
        return res.status(401).send({ path: 'developer', type: 'registered' });

    try {
        await developer.updateOne({
            name,
            email,
            link,
            statement
        });
    } catch(err){
        return res.status(500).send(err);
    }
    res.status(204).send();
}
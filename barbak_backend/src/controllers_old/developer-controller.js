const Developer = require('../models/developer-model');

module.exports.register = async (req, res) => {
    try {
        const { name, email, link, statement } = req.body;

        if (await Developer.findOne({ user: req.user }))
            return res.status(400).send({ path: 'developer', type: 'registered' });

        const registeredDeveloper = new Developer({
            name,
            email,
            link,
            statement,
            user: req.user
        });
        await registeredDeveloper.validate();
        await registeredDeveloper.customValidate();

       const { apiKey, hashedAPIKey } = await Developer.generateAPIKey();

        registeredDeveloper.apiKey = hashedAPIKey;
        await registeredDeveloper.save();
        return res.status(200).send({ apiKey });
    } catch (err) {
        if (err.name === "ValidationError" || err.name === "CustomValidationError") {
            var errors = [];
            
            Object.keys(err.errors).forEach(error => {
                const errorParts = error.split('.');
                const errorPart = errorParts[0];
                const indexPart = errorParts[1] || '0';
                
                errors.push({ 
                    path: errorPart, 
                    type: (err.name === "ValidationError") ? err.errors[error].properties.type : err.errors[error], 
                    index: indexPart 
                });
            })
            return res.status(400).send(errors);
        }
        return res.status(500).send(err);
    }
}

module.exports.regenerateAPIKey = async (req, res) => {
    try {
        const developer = await Developer.findOne({ user: req.user });
        if (!developer)
            return res.status(401).send({ path: 'developer', type: 'registered' });

        const { apiKey, hashedAPIKey } = await Developer.generateAPIKey();

        await developer.update({
            apiKey: hashedAPIKey
        });
        return res.status(200).send({apiKey});
    } catch (err) {
        res.status(500).send(err);
    }
}

module.exports.updateInfo = async (req, res) => {
    try {
        const { name, email, link, statement } = req.body;
        const developer = await Developer.findOne({ user: req.user });

        if (!developer) 
            return res.status(401).send({ path: 'developer', type: 'registered' });

        developer.set({
            name,
            email,
            link,
            statement
        });
        await developer.validate();
        await developer.customValidate();
        await developer.save();
    } catch (err) {
        if (err.name === "ValidationError" || err.name === "CustomValidationError") {
            var errors = [];
            
            Object.keys(err.errors).forEach(error => {
                const errorParts = error.split('.');
                const errorPart = errorParts[0];
                const indexPart = errorParts[1] || '0';
                
                errors.push({ 
                    path: errorPart, 
                    type: (err.name === "ValidationError") ? err.errors[error].properties.type : err.errors[error], 
                    index: indexPart 
                });
            })
            return res.status(400).send(errors);
        }
        return res.status(500).send(err);
    }
    res.status(204).send();
}
const Schemas = {
    account: require('./account-schemas'),
    users: require('./user-schemas'),
    assets: require('./asset-schemas'),
    drinkware: require('./drinkware-schemas'),
    tools: require('./tool-schemas'),
    ingredients: require('./ingredient-schemas')
};

module.exports = (req, res, next) => {
        // Joi validation options
    const validationOptions = {
        abortEarly: false,  // abort after the last validation error
        allowUnknown: true, // allow unknown keys that will be ignored
        stripUnknown: true  // remove unknown keys from the validated data
    };

    return ((req, res, next) => {
        const action = req.method.toLowerCase();
        const resource = req.path.split('/')[1];
        const pathname = req.route.path;
        const schema = Schemas[resource]?.[action]?.[pathname];

        if (!schema)
            return res.status(404).send({ path: 'schema', type: 'exist', message: 'Schema not found' });
        
        const errors = {};
        Object.keys(schema).forEach(storage => {
            const { error, value } = schema[storage].validate(req[storage], validationOptions);

            error 
            ? error.details.forEach(err => {
                const { type, message } = err;
                const [path] = err.path;
                errors[path] = { type, message };
            })
            : (req[storage] = value);
        });

        if (Object.keys(errors).length)
            return res.status(400).send(errors);
        
        next();
    })(req, res, next);
}
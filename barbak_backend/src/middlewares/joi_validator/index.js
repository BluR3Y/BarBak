const _ = require('lodash');
const path = require('path');

const Schemas = {
    account: require('./account-schemas'),
    users: require('./user-schemas'),
    drinkware: require('./drinkware-schemas')
};

module.exports = (req, res, next) => {
    // enabled HTTP methods for request data validation
    const methodStorage = {
        post: 'body',
        get: 'params',
        put: 'body',
        patch: 'body',
        delete: 'params'
    }

    // Joi validation options
    const validationOptions = {
        abortEarly: false,  // abort after the last validation error
        allowUnknown: true, // allow unknown keys that will be ignored
        stripUnknown: true  // remove unknown keys from the validated data
    };

    // return the validation middleware
    return ((req, res, next) => {
        const action = req.method.toLowerCase();
        const resource = req.path.split('/')[1];
        const dataStorage = (Object.keys(req[methodStorage[action]]).length ? methodStorage[action] : 'params');
        const data = req[dataStorage];
        const pathname = (dataStorage === 'params' ? path.dirname(req.path) : req.path);
        const relevantSchemas = Schemas[resource];
        console.log('joi: ', dataStorage, pathname, action, resource, data);
        if (relevantSchemas && _.has(relevantSchemas, pathname)) {
            const schema = _.get(relevantSchemas, pathname);
            if (schema) {
                const { error, value } = schema.validate(data, validationOptions);
                if (error)
                    return res.status(400).send(error.details);
                req[dataStorage] = value;
            }
        }
        next();
    })(req, res, next);
};
const _ = require('lodash');
const url = require('url');

const Schemas = {
    users: require('./user-schemas'),
    developers: require('./developer-schemas'),
    drinks: require('./drink-schemas'),
    ingredients: require('./ingredient-schemas'),
    drinkware: require('./drinkware-schemas'),
    tools: require('./tool-schemas')
};

module.exports = (req, res, next) => {
    // enabled HTTP methods for request data validation
    const _supportedMethods = ['post', 'get'];

    // Joi validation options
    const _validationOptions = {
        abortEarly: false,  // abort after the last validation error
        allowUnknown: true, // allow unknown keys that will be ignored
        stripUnknown: true  // remove unknown keys from the validated data
    };

    // return the validation middleware
    return ((req, res, next) => {
        const route = url.parse(req.url);
        const method = req.method.toLowerCase();
        const path = route.pathname;
        const _relevantSchemas = Schemas[path.split('/')[1]];

        if(_relevantSchemas && _.includes(_supportedMethods, method) && _.has(_relevantSchemas, path)) {
            const _schema = _.get(_relevantSchemas, path);
            const data = (method === 'post') ? req.body : req.query;

            if(_schema) {
                // Validate req.body using the schema and validation options
                const validation = _schema.validate(data, _validationOptions);
                
                if(validation.error) {
                    const { path, type } = validation.error.details[0];
                    return res.status(400).send({ path: path[0], type });
                }

                if(method === 'post') {
                    req.body = validation.value;
                } else if(method === 'get') {
                    req.query = validation.value;
                }
            }
        }
        next();
    })(req,res,next);
};
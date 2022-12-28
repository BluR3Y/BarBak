const Joi = require('joi');

module.exports.registerValidator = (data) => {
    const schema = Joi.object({
        username: Joi.string()
            .min(6)
            .max(30)
            .lowercase()
            .pattern(new RegExp('^[a-zA-Z0-9_.-]*$'))
            .required(),
        email: Joi.string()
            .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org', 'co', 'us'] } })
            .lowercase()
            .required(),
        password: Joi.string()
            .min(6)
            .max(30)
            .pattern(new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).*$'))
            .required()
        
    });
    return schema.validate(data);
}

module.exports.localLoginValidator = (data) => {
    const schema = Joi.object({
        email: Joi.string()
            .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org', 'co', 'us'] } })
            .lowercase()
            .required(),
        password: Joi.string()
            .min(6)
            .max(30)
            .pattern(new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).*$'))
            .required()
    });
    return schema.validate(data);
}
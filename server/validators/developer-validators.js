const Joi = require('joi');

const registerDeveloperSchema = Joi.object({
    name: Joi.string()
        .min(3)
        .max(30)
        .regex(new RegExp('^[a-zA-Z ]+$'))
        .required(),
    email: Joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org', 'co', 'us'] } })
        .lowercase()
        .required(),
    host: Joi.string()
        .uri(),
    statement: Joi.string()
        .max(500)
        .required()
});

module.exports = { registerDeveloperSchema };
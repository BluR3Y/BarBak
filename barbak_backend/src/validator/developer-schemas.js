const Joi = require('joi');

// const registerDeveloperSchema = Joi.object({
//     name: Joi.string()
//         .min(3)
//         .max(30)
//         .regex(new RegExp('^[a-zA-Z ]+$'))
//         .required(),
//     email: Joi.string()
//         .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org', 'co', 'us'] } })
//         .lowercase()
//         .required(),
//     host: Joi.string()
//         .uri(),
//     statement: Joi.string()
//         .max(500)
//         .required()
// });

// module.exports = { registerDeveloperSchema };

const developerName = Joi.string().min(3).max(30).regex(new RegExp('^[a-zA-Z ]+$'));
const developerEmail = Joi.string().lowercase().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org', 'co', 'us'] } });
const developerLink = Joi.string().uri();
const developerStatement = Joi.string().max(500);


const registerDeveloperSchema = Joi.object({
    name: developerName.required(),
    email: developerEmail.required(),
    link: developerLink,
    statement: developerStatement
});

module.exports = {
    '/developers/register': registerDeveloperSchema,
    '/developers/update-info': registerDeveloperSchema,
};
const Joi = require('joi');

// const localLoginSchema = Joi.object({
//     email: Joi.string()
//         .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org', 'co', 'us'] } })
//         .lowercase()
//         .required(),
//     password: Joi.string()
//         .min(6)
//         .max(30)
//         .pattern(new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).*$'))
//         .required()
// });

// const registerSchema = Joi.object({
//     username: Joi.string()
//         .min(6)
//         .max(30)
//         .lowercase()
//         .pattern(new RegExp('^[a-zA-Z0-9_.-]*$'))
//         .required(),
// }).concat(localLoginSchema);

// module.exports = { localLoginSchema, registerSchema };

const userName = Joi.string().lowercase().min(6).max(30).pattern(new RegExp('^[a-zA-Z0-9_.-]*$'));
const userEmail = Joi.string().lowercase().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org', 'co', 'us'] } });
const userPassword = Joi.string().min(6).max(30).pattern(new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).*$'));

const registerUserSchema = Joi.object({
    username: userName.required(),
    email: userEmail.required(),
    password: userPassword.required()
});

const loginUserSchema = Joi.object({
    username: userName.required(),
    password: userPassword.required()
});

module.exports = {
    '/users/register': registerUserSchema,
    '/users/login': loginUserSchema
};
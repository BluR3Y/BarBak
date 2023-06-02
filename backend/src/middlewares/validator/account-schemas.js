const Joi = require('joi');

const usernameSchema = Joi
    .string()
    .lowercase()
    .min(6).
    max(30)
    .pattern(new RegExp('^[a-zA-Z0-9_.-]*$'));
const fullnameSchema = Joi
    .string()
    .max(30)
    .pattern(/^[a-zA-Z\s]+$/);
const emailSchema = Joi
    .string()
    .lowercase()
    .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org', 'co', 'us'] } });
const passwordSchema = Joi
    .string()
    .min(6)
    .max(30)
    .pattern(new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).*$'));
const codeSchema = Joi
    .string()
    .length(6)
    .pattern(/^[0-9]+$/);

const firstRegistrationValidation = Joi.object({
    fullname: fullnameSchema,
    email: emailSchema.required(),
    password: passwordSchema.required()
});

const secondRegistrationValidation = Joi.object({
    registration_code: codeSchema.required()
});

const thirdRegistrationValidation = Joi.object({
    username: usernameSchema.required()
});

const loginValidation = Joi.object({
    username: Joi.alternatives().conditional('type', {
        then: emailSchema.required(),
        otherwise: usernameSchema.required(),
    }),
    password: passwordSchema.required()
});

module.exports = {
    post: {
        '/accounts/login': { body: loginValidation },
        '/accounts/register': { body: firstRegistrationValidation },
        '/accounts/register/validate/:registration_code': { params: secondRegistrationValidation },
        '/accounts/register/username': { body: thirdRegistrationValidation },
    }
}
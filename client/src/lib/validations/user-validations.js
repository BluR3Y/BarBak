import Joi from "joi";

const usernameSchema = Joi
    .string()
    .lowercase()
    .min(6)
    .max(30)
    .pattern(new RegExp('^[a-zA-Z0-9_.-]*$'))
    .messages({
        'string.base': 'Username must be a string',
        'string.empty': 'Username cannot be an empty field',
        'string.min': 'Username must contain atleast {#limit} characters',
        'string.max': 'Username length must not exceed {#limit} characters',
        'any.required': 'Username is required to log in'
    });
const passwordSchema = Joi
    .string()
    .min(6)
    .max(30)
    .pattern(new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).*$'))
    .messages({
        'string.base': 'Password must be a string',
        'string.empty': 'Password cannot be an empty field',
        'string.min': 'Password must contain atleast {#limit} characters',
        'string.max': 'Password length must not exceed {#limit} characters',
        'any.required': 'Password is required to log in',
        'string.pattern.base': `Password must contain: \n
        • Atleast one uppercase letter \n
        • Atleast one lowercase letter \n
        • Atleast one numeric digit \n
        • Atleast one special character from the set #?!@$%^&*-
        `
    });

export const loginValidator = Joi.object({
    username: usernameSchema.required(),
    password: passwordSchema.required()
});
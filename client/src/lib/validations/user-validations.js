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
const fullnameSchema = Joi
    .string()
    .allow('')
    .max(30)
    .pattern(new RegExp('^[A-Za-z ]+$'))
    .messages({
        'string.base': 'Name must be a string',
        'string.max': 'Name length must not exceed {#limit} characters',
        'string.pattern.base': 'Name can only contain letters'
    });

const emailSchema = Joi
    .string()
    .email({ tlds: { allow: false } })
    .messages({
        'string.base': 'Email must be a string',
        'string.empty': 'Email cannot be an empty field',
        'string.email': 'Invalid email address',
    });

export const loginValidator = Joi.object({
    username: usernameSchema.required(),
    password: passwordSchema.required()
});

export const registerFirstValidator = Joi.object({
    fullname: fullnameSchema,
    email: emailSchema.required(),
    password: passwordSchema.required()
});

export const registerThirdValidator = usernameSchema.required();
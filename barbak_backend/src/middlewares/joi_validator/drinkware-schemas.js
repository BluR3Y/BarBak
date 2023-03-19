const Joi = require('joi');

// const usernameSchema = Joi.string().lowercase().min(6).max(30).pattern(new RegExp('^[a-zA-Z0-9_.-]*$'));
// const fullnameSchema = Joi.string().max(30).pattern(/^[a-zA-Z]+$/);
// const emailSchema = Joi.string().lowercase().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org', 'co', 'us'] } });
// const passwordSchema = Joi.string().min(6).max(30).pattern(new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).*$'));
// const codeSchema = Joi.string().length(6).pattern(/^[0-9]+$/);

const mongoIdSchema =  Joi.string().hex().length(24).required();
const nameSchema = Joi.string().lowercase().min(3).max(30).pattern(new RegExp('^[a-zA-Z0-9_.-]*$'));
const descriptionSchema = Joi.string().max(600);

// search
const querySchema = Joi.string().max(30);
const pageSchema = Joi.string().min(1).max(100);
const pageSizeSchema = Joi.string().min(1).max(20);
const orderingSchema = Joi.object();

const createValidation = Joi.object({
    name: nameSchema.required(),
    description: descriptionSchema.required(),
    verified: Joi.bool().default(false)
});

const copyValidation = Joi.object({
    drinkware_id: mongoIdSchema.required(),
});

const getDrinkwareValidation = Joi.object({
    drinkware_id: mongoIdSchema.required()
});

const searchValidation = Joi.object({
    query: querySchema,
    page: pageSchema.default(1),
    page_size: pageSizeSchema.default(10),
    ordering: orderingSchema
});

module.exports = {
    '/drinkware/create': createValidation,
    '/drinkware/copy': copyValidation,
    '/drinkware': getDrinkwareValidation,
    '/drinkware/search': searchValidation
};
const Joi = require('joi');

const mongoIdSchema =  Joi.string().hex().length(24).required();
const nameSchema = Joi.string().lowercase().min(3).max(30).pattern(new RegExp(/^[A-Za-z0-9\- ]+$/));
const descriptionSchema = Joi.string().max(600);
const categorySchema = Joi.string().lowercase().max(30).pattern(new RegExp(/^[a-zA-Z]+$/));

// search
const querySchema = Joi.string().max(30);
const pageSchema = Joi.number().min(1).max(100);
const pageSizeSchema = Joi.number().min(1).max(20);
const categoriesSchema = Joi.string().custom((value, helpers) => {
    try {
        const parsedValue = JSON.parse(value);
        if (!Array.isArray(parsedValue)) {
            return helpers.error('any.invalid');
        } else if (parsedValue.length > 10) {
            return helpers.error('number.max');
        } else
            return parsedValue;
    } catch(err) {
        return helpers.error('any.invalid');
    }
})
.message({
    'number.max': 'Exceeded item limit'
});
const orderingSchema = Joi.string().custom((value, helpers) => {
    try {
        const parsedValue = JSON.parse(value);
        if (typeof parsedValue != 'object')
            return helpers.error('any.invalid');
        return parsedValue;
    } catch(err) {
        return helpers.error('any.invalid');
    }
});

const createValidation = Joi.object({
    name: nameSchema.required(),
    description: descriptionSchema.required(),
    category: categoriesSchema.required(),
    verified: Joi.bool().default(false)
});

const updateValidation = Joi.object({
    tool_id: mongoIdSchema.required(),
    name: nameSchema.required(),
    description: descriptionSchema.required(),
    category: categorySchema.required()
});

const searchValidation = Joi.object({
    query: querySchema.default(''),
    page: pageSchema.default(1),
    page_size: pageSizeSchema.default(10),
    ordering: orderingSchema.default(''),
    categories: categoriesSchema.default([])
});

const clientToolValidation = Joi.object({
    page: pageSchema.default(1),
    page_size: pageSizeSchema.default(10),
    ordering: orderingSchema.default(''),
    categories: categoriesSchema.default([])
});

module.exports = {
    '/tools/create': createValidation,
    '/tools/update': updateValidation,
    '/tools/search': searchValidation,
    '/tools/@me': clientToolValidation
};
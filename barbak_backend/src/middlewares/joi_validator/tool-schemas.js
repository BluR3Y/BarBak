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

const idValidation = Joi.object({
    tool_id: mongoIdSchema.required()
});

const createValidation = Joi.object({
    name: nameSchema.required(),
    description: descriptionSchema.required(),
    category: categorySchema.required(),
    verified: Joi.bool().default(false)
});

const updateValidation = createValidation.concat(idValidation);

const clientToolValidation = Joi.object({
    page: pageSchema.default(1),
    page_size: pageSizeSchema.default(10),
    ordering: orderingSchema.default(''),
    categories: categoriesSchema.default([])
});

const searchValidation = clientToolValidation.concat(Joi.object({
    query: querySchema.default('')
}));

module.exports = {
    // Create Routes
    '/tools/create': createValidation,
    '/tools/create/copy': idValidation,
    
    // Read Routes
    '/tools/search': searchValidation,
    '/tools/@me': clientToolValidation,
    '/tools': idValidation,
    
    // Update Routes
    '/tools/update/info': updateValidation,
    '/tools/update/privacy': idValidation,
    '/tools/update/cover/upload': idValidation,
    '/tools/update/cover/remove': idValidation,

    // Delete Routes
    'tools/delete': idValidation
};
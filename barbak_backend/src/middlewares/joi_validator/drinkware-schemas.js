const Joi = require('joi');

const mongoIdSchema =  Joi.string().hex().length(24).required();
const nameSchema = Joi.string().lowercase().min(3).max(30).pattern(new RegExp(/^[A-Za-z0-9\- ]+$/));
const descriptionSchema = Joi.string().max(600);

// search
const querySchema = Joi.string().max(30);
const pageSchema = Joi.number().min(1).max(100);
const pageSizeSchema = Joi.number().min(1).max(20);
const orderingSchema = Joi.string().custom((value, helpers) => {
    try {
        const parsedValue = JSON.parse(value);
        if (typeof parsedValue !== 'object')
            throw new Error();
        return parsedValue;
    } catch(err) {
        return helpers.error('any.invalid');
    }
});

const createValidation = Joi.object({
    name: nameSchema.required(),
    description: descriptionSchema.required(),
    verified: Joi.bool().default(false)
});

const updateValidation = Joi.object({
    drinkware_id: mongoIdSchema.required(),
    name: nameSchema.required(),
    description: descriptionSchema
});

const idValidation = Joi.object({
    drinkware_id: mongoIdSchema.required()
});

const searchValidation = Joi.object({
    query: querySchema.default(''),
    page: pageSchema.default(1),
    page_size: pageSizeSchema.default(10),
    ordering: orderingSchema.default('')
});

module.exports = {
    '/drinkware/create': createValidation,
    '/drinkware/copy': idValidation,
    '/drinkware': idValidation,
    '/drinkware/search': searchValidation,
    '/drinkware/update/cover/upload': idValidation,
    '/drinkware/update/cover/remove': idValidation,
    '/drinkware/update/info': updateValidation,
    '/drinkware/update/privacy': idValidation
};
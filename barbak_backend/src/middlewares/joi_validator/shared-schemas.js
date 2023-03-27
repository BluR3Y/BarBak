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
            return helpers.error('any.invalid');
        return parsedValue;
    } catch(err) {
        return helpers.error('any.invalid');
    }
});

const arrLimit = (limit) => {
    return Joi.string().custom((value, helpers) => {
        try {
            const parsedValue = JSON.parse(value);
            if (!Array.isArray(parsedValue)) {
                return helpers.error('any.invalid');
            } else if (parsedValue.length > limit) {
                return helpers.error('number.max');
            } else
                return parsedValue;
        } catch(err) {
            return helpers.error('any.invalid');
        }
    }).message({
        'number.max': 'Exceeded item limit'
    });
}

module.exports = {
    mongoIdSchema,
    nameSchema,
    descriptionSchema,
    querySchema,
    pageSchema,
    pageSizeSchema,
    orderingSchema,
    arrLimit
}
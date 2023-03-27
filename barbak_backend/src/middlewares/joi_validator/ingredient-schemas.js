const Joi = require('joi');
const {
    nameSchema,
    descriptionSchema,
    mongoIdSchema,
    pageSchema,
    pageSizeSchema,
    orderingSchema,
    querySchema,
} = require('./shared-schemas');

const categorySchema = Joi.string().lowercase().max(30).pattern(new RegExp(/^[a-zA-Z]+$/));
const categoryFilterSchema = Joi.string().custom((value, helpers) => {
    try {
        const parsedValue = JSON.parse(value);
        if (typeof parsedValue !== 'object')
            return helpers.error('any.invalid');
        else if (Object.keys(parsedValue).length > 10)
            return helpers.error('max.items');
        return parsedValue;
    } catch(err) {
        return helpers.error('any.invalid');
    }
});

const idValidation = Joi.object({
    ingredient_id: mongoIdSchema.required()
});

const createValidation = Joi.object({
    name: nameSchema.required(),
    description: descriptionSchema,
    category: categorySchema.required(),
    sub_category: categorySchema.required(),
    verified: Joi.boolean().default(false)
});

const updateValidation = {
    params: idValidation,
    body: Joi.object({
        name: nameSchema.required(),
        description: descriptionSchema,
        category: categorySchema.required(),
        sub_category: categorySchema.required(),
    })
};

const clientIngredientValidation = Joi.object({
    page: pageSchema.default(1),
    page_size: pageSizeSchema.default(10),
    ordering: orderingSchema.default(''),
    category_filter: categoryFilterSchema.default(null)       // Temporary
})

const searchValidation = clientIngredientValidation.concat(Joi.object({
    query: querySchema.default('')
}));

module.exports = {
    post: {
        '/ingredients': { body: createValidation },
        '/ingredients/copy/:ingredient_id': { params: idValidation }
    },
    get: {
        '/ingredients/@me': { query: clientIngredientValidation },
        '/ingredients/search': { query: searchValidation },
        '/ingredients/:ingredient_id': { params: idValidation }
    },
    patch: {
        '/ingredients/cover/upload/:ingredient_id': { params: idValidation },
        '/ingredients/cover/remove/:ingredient_id': { params: idValidation },
        '/ingredients/privacy/:ingredient_id': { params: idValidation },
        '/ingredients/:ingredient_id': updateValidation
    },
    delete: {
        '/ingredients/:ingredient_id': { params: idValidation }
    }
};
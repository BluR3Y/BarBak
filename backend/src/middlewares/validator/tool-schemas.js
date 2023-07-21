const Joi = require('joi');
const {
    mongoIdSchema,
    nameSchema,
    descriptionSchema,
    querySchema,
    pageSchema,
    pageSizeSchema,
    orderingSchema,
    arrLimit
} = require('./shared-schemas');

const categorySchema = Joi.string().lowercase().max(30).pattern(new RegExp(/^[a-zA-Z]+$/));

const idValidation = Joi.object({
    tool_id: mongoIdSchema.required()
});

const createValidation = Joi.object({
    name: nameSchema.required(),
    description: descriptionSchema.required(),
    category: categorySchema.required(),
    verified: Joi.bool().default(false)
});

const updateValidation = {
    params: idValidation,
    body: Joi.object({
        name: nameSchema.required(),
        description: descriptionSchema.required(),
        category: categorySchema.required()
    })
};

const clientToolValidation = Joi.object({
    page: pageSchema.default(1),
    page_size: pageSizeSchema.default(10),
    ordering: orderingSchema.default(''),
    categories: arrLimit(10).default([])
});

const searchValidation = clientToolValidation.concat(Joi.object({
    query: querySchema.default('')
}));

module.exports = {
    post: {
        '/tools': { body: createValidation },
        '/tools/copy/:tool_id': { params: idValidation }
    },
    get: {
        '/tools/@me': { query: clientToolValidation },
        '/tools/search': { query: searchValidation },
        '/tools/:tool_id': { params: idValidation }
    },
    patch: {
        '/tools/privacy/:tool_id': { params: idValidation },
        '/tools/cover/upload/:tool_id': { params: idValidation },
        '/tools/cover/remove/:tool_id': { params: idValidation },
        '/tools/:tool_id': updateValidation
    },
    delete: {
        '/tools/:tool_id': { params: idValidation }
    }
}
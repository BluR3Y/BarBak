const Joi = require('joi');

const {
    mongoIdSchema, 
    nameSchema,
    descriptionSchema,
    querySchema,
    pageSchema,
    pageSizeSchema,
    orderingSchema
} = require('./shared-schemas');

const idValidation = Joi.object({
    drinkware_id: mongoIdSchema.required()
});

const createValidation = {
    body: Joi.object({
        name: nameSchema.required(),
        description: descriptionSchema.required(),
        verified: Joi.bool().default(false)
    })
};

const clientDrinkwareValidation = {
    query: Joi.object({
        page: pageSchema.default(1),
        page_size: pageSizeSchema.default(10),
        ordering: orderingSchema.default('')
    })
};

const getDrinkwareValidation = {
    params: idValidation.concat(Joi.object({
        privacy: Joi.string()
    }))
}

const searchValidation = {
    query: clientDrinkwareValidation.query.concat(Joi.object({
        query: querySchema.default('')
    }))
};

const updateValidation = {
    params: idValidation,
    body: Joi.object({
        name: nameSchema.required(),
        description: descriptionSchema
    })
};

module.exports = {
    post: {
        '/drinkware/:drinkware_type?': createValidation,
        '/drinkware/copy/:drinkware_id': { params: idValidation }
    },
    get: {
        '/drinkware/@me': clientDrinkwareValidation,
        '/drinkware/search': searchValidation,
        '/drinkware/:drinkware_id/:privacy?': getDrinkwareValidation,
    },
    patch: {
        '/drinkware/cover/upload/:drinkware_id': { params: idValidation },
        '/drinkware/cover/remove/:drinkware_id': { params: idValidation },
        '/drinkware/privacy/:drinkware_id': { params: idValidation },
        '/drinkware/:drinkware_id': updateValidation,
    },
    delete: {
        '/drinkware/:drinkware_id': { params: idValidation }
    }
};
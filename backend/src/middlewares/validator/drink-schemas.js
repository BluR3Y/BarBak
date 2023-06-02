const Joi = require('joi');
const { mongoIdSchema, pageSchema, pageSizeSchema, querySchema, orderingSchema, arrLimit } = require('./shared-schemas');


const idValidation = Joi.object({
    drink_id: mongoIdSchema.required()
});
const drinkNameSchema = Joi.string()
    .lowercase()
    .min(3)
    .max(30)
    // Allow alphabetical characters, spaces, periods and dashes
    .pattern(new RegExp('^[a-zA-Z\s.-]+$'));
const drinkDescriptionSchema = Joi.string()
    .max(600);
const drinkPreparationSchema = Joi.array()
    .items(Joi.string()
        .min(3)
        .max(100))
    .max(25);

const ingredientObjectSchema = {
    ingredient: mongoIdSchema.required(),
    measure: Joi.object({
        unit: Joi.number()
            .min(0)
            .max(100)
            .required(),
        quantity: Joi.number()
            .min(0.01)
            .max(1000)
            .required()
    })
};
const drinkIngredientSchema = Joi.object({
    ...ingredientObjectSchema,
    substitutes: Joi.array()
        .items(Joi.object(ingredientObjectSchema))
        .max(5)
        .required(),
    optional: Joi.boolean(),
    garnish: Joi.boolean()
})

const drinkToolSchema = Joi.array()
    .items(mongoIdSchema)
    .max(15);
const drinkTags = Joi.array()
    .items(Joi.string().min(3).max(20))
    .max(10);

const createDrinkValidator = Joi.object({
    name: drinkNameSchema.required(),
    description: drinkDescriptionSchema.required(),
    preparation_method: Joi.number().min(0).max(20).required(),
    serving_style: Joi.number().min(0).max(20).required(),
    drinkware: mongoIdSchema.required(),
    preparation: drinkPreparationSchema.required(),
    ingredients: Joi.array().items(drinkIngredientSchema).min(2).max(25).required(),
    tools: drinkToolSchema.required(),
    tags: drinkTags.required()
});

const modifyDrinkValidator = Joi.object({
    name: drinkNameSchema,
    description: drinkDescriptionSchema,
    preparation_method: Joi.number().min(0).max(20),
    serving_style: Joi.number().min(0).max(20),
    preparation: drinkPreparationSchema,
    tags: drinkTags
});

const searchDrinkValidator = Joi.object({
    query: querySchema.default(''),
    page: pageSchema.default(1),
    page_size: pageSizeSchema.default(10),
    ordering: orderingSchema.default(''),
    preparation_methods: arrLimit(10).default([]),
    serving_styles: arrLimit(10).default([])
});

module.exports = {
    post: {
        '/drinks/:drink_id/copy': { params: idValidation },
        '/drinks/:drink_id/gallery': { params: idValidation },
        '/drinks/:drink_id/ingredients': { body: drinkIngredientSchema },
        '/drinks/:drink_id/tools/:tool_id': { params: idValidation.append({ tool_id: mongoIdSchema.required() }) },
        '/drinks/:drink_type(user|verified)?': { body: createDrinkValidator }
    },
    get: {
        '/drinks/search': { query: searchDrinkValidator },
        '/drinks/@me': { query: searchDrinkValidator },
        '/drinks/:drink_id': { params: idValidation }
    },
    patch: {
        '/drinks/:drink_id/ingredients/:ingredient_id': {
            params: idValidation.append({ ingredient_id: mongoIdSchema.required() }),
            body: drinkIngredientSchema
        },
        '/drinks/:drink_id': {
            params: idValidation,
            body: modifyDrinkValidator
        }
    },
    delete: {
        '/drinks/:drink_id/gallery/:image_id': { params: idValidation.append({ image_id: mongoIdSchema.required() }) },
        '/drinks/:drink_id/ingredients/:ingredient_id': { params: idValidation.append({ ingredient_id: mongoIdSchema.required() }) },
        '/drinks/:drink_id/tools/:tool_id': { params: idValidation.append({ tool_id: mongoIdSchema.required() }) },
        '/drinks/:drink_id': { params: idValidation }
    }
}
const Joi = require('joi');

const ingredientSchema = Joi.object({
    ingredientId: Joi.string()
        .hex()
        .length(24)
        .required(),
    amount: Joi.number()
        .min(0)
        .max(99999)
        .required(),
    measure: Joi.string()
        .lowercase()
        .required()
});

const createDrinkSchema = Joi.object({
    name: Joi.string()
        .min(3)
        .max(30)
        .lowercase(),
    description: Joi.string()
        .max(500),
    // drink_category: Joi.string()
    //     .lowercase()
    //     .valid('cocktail', 'mocktail', 'other')
    //     .required(),
    preparation_method: Joi.string()
        .lowercase()
        .valid('build', 'stir', 'shake', 'blend', 'layer', 'muddle')
        .required(),
    serving_style: Joi.string()
        .lowercase()
        .valid('on-the-rocks', 'straight-up', 'flaming', 'heated', 'neat'),
    ingredients: Joi.array()
        .min(2)
        .max(30)
        .items(ingredientSchema)
        .required(),
    drinkware: Joi.array()
        .min(1)
        .max(30)
        .items(Joi.object()),
    equipment: Joi.array()
        .max(30)
        .items(Joi.object()),
    preparation: Joi.array()
        .max(40)
        .items(Joi.string()),
    tags: Joi.array()
        .max(15)
        .items(Joi.string())
});

module.exports = { createDrinkSchema };
const Joi = require('joi');

const createDrinkSchema = Joi.object({
    name: Joi.string()
        .min(3)
        .max(30)
        .lowercase(),
    description: Joi.string()
        .max(280),
    drink_category: Joi.string()
        .lowercase()
        .valid('cocktail', 'mocktail', 'other')
        .required(),
    ingredients: Joi.array()
        .min(2)
        .max(30)
        .items(Joi.object()),
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
const Joi = require('joi');

const createIngredientSchema = Joi.object({
    name: Joi.string()
        .min(3)
        .max(30)
        .lowercase()
        .required(),
    description: Joi.string()
        .max(500),
    category: Joi.string()
        .lowercase()
        .valid('alcohol', 'beverage', 'juice', 'fruit', 'other')
        .required(),
});

const createAlcoholicIngredientSchema = Joi.object({
    alcohol_category: Joi.string()
        .lowercase()
        .valid('beer', 'wine', 'liquor', 'liqueur', 'other')
        .required(),
    alcohol_by_volume: Joi.array()
        .max(2)
        .items(
            Joi.number()
            .min(0)
            .max(100)
        )
}).concat(createIngredientSchema);

module.exports = { createIngredientSchema, createAlcoholicIngredientSchema };
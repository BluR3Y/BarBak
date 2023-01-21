const Joi = require('joi');

// const createIngredientSchema = Joi.object({
//     name: Joi.string()
//         .min(3)
//         .max(30)
//         .lowercase()
//         .required(),
//     description: Joi.string()
//         .max(500),
//     category: Joi.string()
//         .lowercase()
//         .valid('alcohol', 'beverage', 'juice', 'fruit', 'other')
//         .required(),
// });

// const createAlcoholicIngredientSchema = Joi.object({
//     alcohol_category: Joi.string()
//         .lowercase()
//         .valid('beer', 'wine', 'liquor', 'liqueur', 'other')
//         .required(),
//     alcohol_by_volume: Joi.array()
//         .max(2)
//         .items(
//             Joi.number()
//             .min(0)
//             .max(100)
//         )
// }).concat(createIngredientSchema);

// module.exports = { createIngredientSchema, createAlcoholicIngredientSchema };

const ingredientName = Joi.string().lowercase().min(3).max(30);
const ingredientDescription = Joi.string().max(500);
const ingredientCategory = Joi.string().lowercase().valid('alcohol', 'beverage', 'juice', 'fruit', 'other');
const ingredientAlcoholCategory = Joi.string().lowercase().valid('beer', 'wine', 'liquor', 'liqueur', 'other');
const ingredientAlcoholByVolume = Joi.array().min(1).max(2).items(Joi.number().min(0).max(100));

const createIngredientSchema = Joi.object({
    name: ingredientName.required(),
    description: ingredientDescription,
    category: ingredientCategory.required(),
    alcohol_category: ingredientAlcoholCategory
        .when('category', {
            is: 'alcohol',
            then: Joi.required(),
            otherwise: Joi.forbidden()
        }),
    alcohol_by_volume: ingredientAlcoholByVolume
        .when('category', {
            not: 'alcohol', 
            then: Joi.forbidden()
        })
});


module.exports = {
    '/ingredients/create': createIngredientSchema
};
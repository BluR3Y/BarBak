const Joi = require('joi');

// const ingredientSchema = Joi.object({
//     ingredientId: Joi.string()
//         .hex()
//         .length(24)
//         .required(),
//     amount: Joi.number()
//         .min(0)
//         .max(99999)
//         .required(),
//     measure: Joi.string()
//         .lowercase()
//         .required()
// });

// const createDrinkSchema = Joi.object({
//     name: Joi.string()
//         .min(3)
//         .max(30)
//         .lowercase(),
//     description: Joi.string()
//         .max(500),
//     // drink_category: Joi.string()
//     //     .lowercase()
//     //     .valid('cocktail', 'mocktail', 'other')
//     //     .required(),
//     preparation_method: Joi.string()
//         .lowercase()
//         .valid('build', 'stir', 'shake', 'blend', 'layer', 'muddle')
//         .required(),
//     serving_style: Joi.string()
//         .lowercase()
//         .valid('on-the-rocks', 'straight-up', 'flaming', 'heated', 'neat'),
//     ingredients: Joi.array()
//         .min(2)
//         .max(30)
//         .items(ingredientSchema)
//         .required(),
//     drinkware: Joi.array()
//         .max(3)
//         .items(Joi.object()),
//     tools: Joi.array()
//         .max(30)
//         .items(Joi.object()),
//     preparation: Joi.array()
//         .max(40)
//         .items(Joi.string()),
//     tags: Joi.array()
//         .max(15)
//         .items(Joi.string())
// });
const ingredients = require('./ingredient-schemas');

const drinkName = Joi.string().lowercase().min(3).max(30);
const drinkDescription = Joi.string().max(500);
const drinkPreparationMethod = Joi.string().lowercase().valid('build', 'stir', 'shake', 'blend', 'layer', 'muddle');
const drinkServingStyle = Joi.string().lowercase().valid('on-the-rocks', 'straight-up', 'flaming', 'heated', 'neat');
// const drinkIngredients = Joi.array().min(2).max(30).items('place-holder***');
// const drinkDrinkware = Joi.array().min(1).max(3).items('placeholder');
// const drinkTools = Joi.array().max(15).items('place-holder');
const drinkPreparation = Joi.array().min(2).max(30).items(Joi.string());
const drinkTags = Joi.array().max(15).items(Joi.string());

const createDrinkSchema = Joi.object({
    name: drinkName.required(),
    description: drinkDescription,
    preparation_method: drinkPreparationMethod.required(),
    serving_style: drinkServingStyle.required(),
    // ingredients: drinkIngredients.required(),
    // drinkware: drinkDrinkware,
    // tools: drinkTools,
    preparation: drinkPreparation.required(),
    tags: drinkTags
});

module.exports = {
    '/drinks/create': createDrinkSchema,
};
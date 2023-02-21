const Joi = require('joi');

// const createDrinkwareSchema = Joi.object({
//     name: Joi.string()
//         .min(3)
//         .max(30)
//         .lowercase()
//         .required(),
//     description: Joi.string()
//         .max(500)
// });

// const searchDrinkwareSchema = Joi.object({
//     searchQuery: Joi.string()
//         .max(30)
//         .lowercase()
//         .required()
// });

// module.exports = { createDrinkwareSchema, searchDrinkwareSchema };

const drinkwareName = Joi.string().lowercase().min(3).max(30);
const drinkwareDescription = Joi.string().max(500);

const createDrinkwareSchema = Joi.object({
    name: drinkwareName.required(),
    description: drinkwareDescription
});

module.exports = {
    '/drinkware/create': createDrinkwareSchema
};
const Joi = require('joi');

const createDrinkwareSchema = Joi.object({
    name: Joi.string()
        .max(30)
        .lowercase()
        .required(),
    description: Joi.string()
        .max(500)
});

const searchDrinkwareSchema = Joi.object({
    searchQuery: Joi.string()
        .max(30)
        .lowercase()
        .required()
});

module.exports = { createDrinkwareSchema, searchDrinkwareSchema };
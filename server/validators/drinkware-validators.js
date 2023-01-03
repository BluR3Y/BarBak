const Joi = require('joi');

const createDrinkwareSchema = Joi.object({
    name: Joi.string()
        .max(30)
        .lowercase()
        .required(),
    description: Joi.string()
        .max(280)
});

module.exports = { createDrinkwareSchema };
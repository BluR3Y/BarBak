const Joi = require('joi');

const createToolSchema = Joi.object({
    name: Joi.string()
        .min(3)
        .max(30)
        .lowercase()
        .required(),
    description: Joi.string()
        .max(500)
});

module.exports = { createToolSchema };
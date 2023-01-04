const Joi = require('joi');

const createToolSchema = Joi.object({
    name: Joi.string()
        .max(30)
        .lowercase()
        .required(),
    description: Joi.string()
        .max(500)
});

module.exports = { createToolSchema };
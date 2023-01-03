const Joi = require('joi');

const createToolSchema = Joi.object({
    name: Joi.string()
        .max(30)
        .lowercase()
        .required(),
    description: Joi.string()
        .max(280)
});

module.exports = { createToolSchema };
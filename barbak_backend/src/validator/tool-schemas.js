const Joi = require('joi');

// const createToolSchema = Joi.object({
//     name: Joi.string()
//         .min(3)
//         .max(30)
//         .lowercase()
//         .required(),
//     description: Joi.string()
//         .max(500)
// });

// module.exports = { createToolSchema };

const toolName = Joi.string().lowercase().min(3).max(30);
const toolDescription = Joi.string().max(500);

const createToolSchema = Joi.object({
    name: toolName.required(),
    description: toolDescription
});


module.exports = {
    '/tools/create': createToolSchema
};
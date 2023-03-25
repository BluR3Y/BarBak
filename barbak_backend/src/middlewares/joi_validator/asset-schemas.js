const Joi = require('joi');

const mongoIdSchema =  Joi.string().hex().length(24).required();

const privateValidation = Joi.object({
    file_id: mongoIdSchema.required()
});

module.exports = {
    '/assets/private/': privateValidation
}
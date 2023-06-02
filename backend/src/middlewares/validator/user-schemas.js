const Joi = require('joi');
const { mongoIdSchema, nullSchema } = require('./shared-schemas');

const usernameSchema = Joi
    .string()
    .lowercase()
    .min(6)
    .max(30)
    // Allow only alphanumeric characters, underscores and hyphens
    .pattern(new RegExp('^[a-zA-Z0-9_-]*$'));

const getUserValidator = Joi.object({
    user_id: mongoIdSchema.required()
});

const modifyUserValidation = Joi.object({
    username: usernameSchema,
    profile_image: nullSchema
});

module.exports = {
    get: {
        '/users/:user_id': { params: getUserValidator },
    },
    patch: {
        '/users/@me': { body: modifyUserValidation }
    }
};
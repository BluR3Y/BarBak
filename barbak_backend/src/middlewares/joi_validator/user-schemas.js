const Joi = require('joi');
const { mongoIdSchema } = require('./shared-schemas');

const usernameSchema = Joi.string().lowercase().min(6).max(30).pattern(new RegExp('^[a-zA-Z0-9_.-]*$'));

const getUserValidator = Joi.object({
    user_id: mongoIdSchema.required()
});

const changeUsernameValidator = Joi.object({
    username: usernameSchema.required()
});

module.exports = {
    get: {
        '/users/:user_id': { params: getUserValidator },
    },
    patch: {
        '/users/username': { body: changeUsernameValidator }
    }
};
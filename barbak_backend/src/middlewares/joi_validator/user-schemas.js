const Joi = require('joi');

const mongoIdSchema =  Joi.string().hex().length(24).required();
const usernameSchema = Joi.string().lowercase().min(6).max(30).pattern(new RegExp('^[a-zA-Z0-9_.-]*$'));

const getUserValidator = Joi.object({
    user_id: mongoIdSchema.required()
});

const changeUsernameValidator = Joi.object({
    username: usernameSchema.required()
});

module.exports = {
    '/users': getUserValidator,
    '/users/update/username': changeUsernameValidator
};
const Joi = require('joi');

module.exports.create_user_drinkware = (data) => {
    const schema = Joi.object({
        name: Joi.string()
            .max(30)
            .lowercase()
            .required(),
        description: Joi.string()
            .max(280)
    });
    return schema.validate(data);
}
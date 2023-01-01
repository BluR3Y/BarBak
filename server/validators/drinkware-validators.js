const Joi = require('joi');

module.exports.create_drinkware_validator = (data) => {
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
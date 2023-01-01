const Joi = require('joi');

module.exports.create_tool_validator = (data) => {
    const toolSchema = Joi.object({
        name: Joi.string()
            .max(30)
            .lowercase()
            .required(),
        description: Joi.string()
            .max(280)
    });
    return toolSchema.validate(data);
}
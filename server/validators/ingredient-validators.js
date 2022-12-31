const Joi = require('joi');

module.exports.create_user_ingredient = (data) => {
    const ingredientSchema = Joi.object({
        name: Joi.string()
            .max(30)
            .lowercase()
            .required(),
        description: Joi.string()
            .max(280)
        
    })
}
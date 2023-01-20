const Joi = require('joi');

const drinkwareName = Joi.string()
    .min(3)
    .max(30)
    .lowercase();

const drinkwareDescription = Joi.string()
    .max(500);

const searchSchema = Joi.object({
    search: drinkwareName.required()
})

module.exports = {
    '/drinkware': searchSchema
}
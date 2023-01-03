const mongoose = require('mongoose');
const drinkValidators = require('../validators/drink-validators');

const drinkSchema = new mongoose.Schema({
    name: {
        type: String,
        minLength: 2,
        maxLength: 30,
        lowercase: true,
    },
    description: {
        type: String,
    },
    type: {
        type: String,
    },
}, { collection: 'drinks' });

drinkSchema.statics.createDrinkValidator = function(data) {
    return drinkValidators.createDrinkSchema.validate(data);
}

module.exports = mongoose.model("drink", drinkSchema);
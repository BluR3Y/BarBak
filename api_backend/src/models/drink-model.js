const mongoose = require('mongoose');
// const drinkValidators = require('../validators/drink-validators');

const drinkSchema = new mongoose.Schema({
    name: {
        type: String,
        minLength: 3,
        maxLength: 30,
        lowercase: true,
        required: true,
    },
    description: {
        type: String,
        maxLength: 500,
    },
    preparation_method: {
        type: String,
        lowercase: true,
        required: true,
        enum: {
            values: ['build', 'stir', 'shake', 'blend', 'layer', 'muddle'],
            message: props => `${props.value} is not a valid 'preparation_method' state`
        }
    },
    serving_style: {
        type: String,
        lowercase: true,
        enum: {
            values: ['on-the-rocks', 'straight-up', 'flaming', 'heated', 'neat'],
            message: props => `${props.value} is not a valid 'serving_style' state`
        }
    },
    ingredients: {
        type: Array,
        minLength: 2,
        maxLength: 30,
        required: true,
    },
    drinkware: {
        type: Array,
        maxLength: 3,
    },
    tools: {
        type: Array,
        maxLength: 20,
    },
    preparation: {
        type: Array,
        max: 30,
    },
    tags: {
        type: Array,
        max: 10,
    }
}, { collection: 'drinks' });

// drinkSchema.statics.createDrinkValidator = function(data) {
//     return drinkValidators.createDrinkSchema.validate(data);
// }

module.exports = mongoose.model("drink", drinkSchema);
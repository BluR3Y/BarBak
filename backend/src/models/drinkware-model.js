const mongoose = require('mongoose');
const drinkwareValidators = require('../validators/drinkware-validators');

const drinkwareSchema = new mongoose.Schema({
    name: {
        type: String,
        minLength: 3,
        maxLength: 30,
        lowercase: true,
        required: true
    },
    description: {
        type: String,
        maxLength: 500,
    },
    user: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true,
        immutable: true,
    },
    visibility: {
        type: String,
        required: true,
        lowercase: true,
        enum: {
            values: ['private', 'public', 'in-review'],
            message: props => `${props.value} is not a valid 'visibility' state`,
        }
    },
    creation_date: {
        type: Date,
        immutable: true,
        default: () => Date.now(),
    }
}, { collection: 'drinkware' });

drinkwareSchema.statics.createDrinkwareValidator = function(data) {
    return drinkwareValidators.createDrinkwareSchema.validate(data);
}

drinkwareSchema.statics.searchDrinkwareValidator = function(data) {
    return drinkwareValidators.searchDrinkwareSchema.validate(data);
}

module.exports = mongoose.model("drinkware", drinkwareSchema);
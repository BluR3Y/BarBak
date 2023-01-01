const mongoose = require('mongoose');

const drinkwareSchema = new mongoose.Schema({
    name: {
        type: String,
        maxLength: 30,
        required: true
    },
    description: {
        type: String,
        maxLength: 280,
    },
    user: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true,
        immutable: true,
    },
    visibility: {
        type: String,
        default: 'private',
        validate: {
            validator: val => (val === 'private' || val === 'public' || val === 'in-review'),
            message: props => `${props.value} is not a valid state`,
        },
    },
    creation_date: {
        type: Date,
        required: true,
        immutable: true,
        default: () => Date.now(),
    }
}, { collection: 'drinkware' });

module.exports = mongoose.model("drinkware", drinkwareSchema);
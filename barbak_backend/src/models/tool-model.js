const mongoose = require('mongoose');

const toolSchema = new mongoose.Schema({
    name: {
        type: String,
        minLength: 3,
        maxlength: 30,
        required: true,
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
        required: true,
        immutable: true,
        default: () => Date.now(),
    }
}, { collection: 'tools' });

module.exports = mongoose.model("tool", toolSchema);
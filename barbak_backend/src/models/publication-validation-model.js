const mongoose = require('mongoose');

const publicationValidationSchema = new mongoose.Schema({
    referenced_request: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Publication Request'
    },
    validator: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    validation: {
        type: Boolean,
        required: true
    },
    reasoning: {
        type: String,
        required: true,
    },
    date_validated: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    }
},{ collection: 'publication-validations' });

module.exports = mongoose.model("Publication Validation", publicationValidationSchema);
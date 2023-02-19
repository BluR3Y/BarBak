const mongoose = require('mongoose');

const publicationValidationSchema = new mongoose.Schema({
    referencedDocument: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'referencedModel'
    },
    referencedModel: {
        type: String,
        required: true,
        enum: [ 'Private Tool', 'Private Drinkware', 'Private Drink', 'Private Ingredient' ]
    },
    validator: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    validation: {
        type: String,
        required: true,
        enum: [ 'approve', 'reject']
    },
    reasoning: {
        type: String,
        required: true,
        minLength: 30,
        maxLength: 400
    }
});

module.exports = mongoose.model("Publication Validation", publicationValidationSchema);
const mongoose = require('mongoose');

const expertValidators = {
    validator: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    validation: {
        type: Boolean,
        required: true,
    },
    reasoning: {
        type: String,
        required: true,
        minLength: 30,
        maxLength: 400
    }
};

const publicationRequestSchema = new mongoose.Schema({
    referenced_document: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'referenced_model'
    },
    referenced_model: {
        type: String,
        required: true,
        enum: [ 'Private Tool', 'Private Ingredient', 'Private Drinkware', 'Private Drink' ]
    },
    snapshot: {
        type: Object,
        required: true,
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    validations: {
        type: [expertValidators],
        default: [],
        validate: (val) => {
            return val.length <= 3;
        },
    },
    activeRequest: {
        type: Boolean,
        required: true,
        default: true,
    },
    date_requested: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    }
}, { collection: 'publication-requests' });

publicationRequestSchema.query.allowedInfo = function() {
    return this.select('snapshot');
};

publicationRequestSchema.methods.submitExpertValidation = async function( validator, validation, reasoning) {
    const createdValidation = {
        validator,
        validation,
        reasoning
    };
    this.validations.push(createdValidation);
    console.log(this)
}


module.exports = mongoose.model("Publication Request", publicationRequestSchema);
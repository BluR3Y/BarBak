const mongoose = require('mongoose');
const PublicationRequest = require('./publication-request-model');

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

publicationValidationSchema.post('save', async function(doc) {
    const requestValidations = await this.model('Publication Validation').find({ referenced_request: doc.referenced_request });
    if (requestValidations.length >= 3) {
        const createdRequest = await PublicationRequest.findOne({ _id: doc.referenced_request });
        const documentModel = mongoose.model(createdRequest.referenced_model);
        await documentModel.makePublic(createdRequest.snapshot);
        createdRequest['activeRequest'] = false;
        await createdRequest.save();
    }
})

module.exports = mongoose.model("Publication Validation", publicationValidationSchema);
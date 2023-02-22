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
        let publicModel;
        switch (createdRequest.referenced_model) {
            case 'Private Tool':
                publicModel = mongoose.model('Public Tool');
                break;
            case 'Private Drinkware':
                publicModel = mongoose.model('Public Drinkware');
                break;
            case 'Private Ingredient':
                publicModel = mongoose.model('Public Ingredient');
                break;
            case 'Private Drink':
                publicModel = mongoose.model('Public Drink');
                break;
            default:
                break;
        }
        const publicDocument = new publicModel({
            ...createdRequest.snapshot
        });
        await publicDocument.save();
        createdRequest['activeRequest'] = false;
        await createdRequest.save();
    }
})

module.exports = mongoose.model("Publication Validation", publicationValidationSchema);
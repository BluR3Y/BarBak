const mongoose = require('mongoose');

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
    activeRequest: {
        type: Boolean,
        required: true,
        default: true,
    },
    model: {
        type: String,
        select: true
    },
    date_requested: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    }
}, { collection: 'publication-requests' });

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
    const requestValidations = await PublicationValidation.find({ referenced_request: doc.referenced_request });
    if (requestValidations.length >= 3) {
        // await PublicationRequest.findOneAndUpdate({ _id: doc.referenced_request }, { activeRequest: false });
        const createdRequest = await PublicationRequest.findOne({ _id: doc.referenced_request });
        // const requestModel = mongoose.model(createdRequest.referenced_model);
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

const PublicationRequest = mongoose.model("Publication Request", publicationRequestSchema);
const PublicationValidation = mongoose.model("Publication Validation", publicationValidationSchema);
module.exports = { PublicationRequest, PublicationValidation };
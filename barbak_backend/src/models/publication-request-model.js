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

module.exports = mongoose.model("Publication Request", publicationRequestSchema);
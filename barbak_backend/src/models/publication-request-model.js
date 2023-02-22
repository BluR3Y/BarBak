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

publicationRequestSchema.query.filterByType = function(types) {
    if (!types)
        return this;
    var typeConvertions = [];
    for (const type in types) {
        switch (types[type]) {
            case 'tool':
                typeConvertions.push('Private Tool');
                break;
            case 'drinkware':
                typeConvertions.push('Private Drinkware');
                break;
            case 'ingredient':
                typeConvertions.push('Private Ingredient');
                break;
            case 'drink':
                typeConvertions.push('Private Drink');
                break;
            default:
                break;
        }
    }
    return this.where('referenced_model').in(typeConvertions)
}

publicationRequestSchema.virtual('requestType').get(function() {
    var requestType;
    switch (this.referenced_model) {
        case 'Private Tool':
            requestType = 'tool';
            break;
        case 'Private Drinkware':
            requestType = 'drinkware';
            break;
        case 'Private Ingredient':
            requestType = 'ingredient';
            break;
        case 'Private Drink':
            requestType = 'drink';
            break;
        default:
            break;
    }
    return requestType;
})

module.exports = mongoose.model("Publication Request", publicationRequestSchema);
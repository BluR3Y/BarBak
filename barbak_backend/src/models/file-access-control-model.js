const mongoose = require('mongoose');

const FileAccessControl = mongoose.model('File Access Control', new mongoose.Schema({
    file_name: {
        type: String,
        required: true
    },
    file_size: {
        type: Number,
        required: true
    },
    mime_type: {
        type: String,
        required: true
    },
    file_path: {
        type: String,
        required: true
    },
    date_uploaded: {
        type: Date,
        default: () => Date.now()
    }
},{ collection: 'file-access-control', discriminatorKey: 'variant' }));

const assetAccessControl = new mongoose.Schema({
    referenced_document: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'referenced_model'
    }, 
    referenced_model: {
        type: String,
        required: true
    }
});

assetAccessControl.path('referenced_document').validate(async function(document) {
    return (await this.model(this.referenced_model).exists({ _id: document }));
}, 'Referenced document does not exist', 'exist');

assetAccessControl.virtual('document_info', {
    ref: function() {
        return this.referenced_model;
    },
    localField: 'referenced_document',
    foreignField: '_id'
});

assetAccessControl.pre('validate', function(next) {
    if (!['User','Tool','Ingredient','Drinkware','Drink'].includes(this.referenced_model)) {
        this.invalidate('referenced_model', 'Invalid document model', this.referenced_model, 'valid');
        this.$ignore('referenced_document');
    }
    next();
});

assetAccessControl.pre('findOne', async function(next) {
    this.populate('document_info');
    next();
});

module.exports = {
    FileAccessControl,
    AssetAccessControl: FileAccessControl.discriminator('Asset Access Control', assetAccessControl)
};
const mongoose = require('mongoose');
const path = require('path');

// Abstract Schema that all discriminators will contain

const AccessControl = mongoose.model('Access Control', new mongoose.Schema({
    file_name: {
        type: String,
        required: true,
    },
    file_size: {
        type: Number,
        required: true,
    },
    mime_type: {
        type: String,
        required: true,
    },
    file_path: {
        type: String,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date_uploaded: {
        type: Date,
        default: () => Date.now()
    }
},{ collection: 'access-control', discriminatorKey: 'model' }));

AccessControl.schema.statics.getDocument = async function(filepath) {
    return (await this.findOne({ _id: path.basename(filepath) }));
}

const appLevelSchema = new mongoose.Schema({
    referenced_document: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'referenced_model'
    },
    referenced_model: {
        type: String,
        required: true,
        enum: [ 'Drinkware', 'Tool' ]
    }
});

appLevelSchema.statics.createInstance = function(file, user, referenced_document) {
    return new this({
        file_name: file.filename,
        file_size: file.size,
        mime_type: file.mimetype,
        file_path: file.path,
        user,
        referenced_document,
        referenced_model: 'Drinkware'
    });
}

appLevelSchema.methods.updateInstance = function(file) {
    this.file_name = file.filename;
    this.mime_type = file.mimetype;
    this.file_size = file.size;
    this.file_path = file.path;
}

// Authorize may change to variants if multiple models are used
appLevelSchema.methods.authorize = async function(user) {
    if (this.user.equals(user))
        return true;

    await this.populate('referenced_document');
    return this.referenced_document.public;
}

module.exports = {
    AccessControl,
    AppAccessControl: AccessControl.discriminator('App Access Control', appLevelSchema)
};
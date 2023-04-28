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
    }
},{ collection: 'file-access-control', discriminatorKey: 'variant' }));

const verifiedAssetControlSchema = new mongoose.Schema();

const userAssetControlSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    public: {
        type: Boolean,
        default: false
    }
});

module.exports = {
    FileAccessControl,
    VerifiedAssetControl: FileAccessControl.discriminator('Verified Asset Access Control', verifiedAssetControlSchema),
    UserAssetControl: FileAccessControl.discriminator('User Asset Access Control', userAssetControlSchema)
};
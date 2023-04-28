const mongoose = require('mongoose');

const AssetAccessControl = mongoose.model('Asset Access Control', new mongoose.Schema({
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
},{ collection: 'asset-access-control', discriminatorKey: 'variant' }));

const verifiedSchema = new mongoose.Schema();

const userSchema = new mongoose.Schema({
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
    AssetAccessControl,
    VerifiedAssetControl: AssetAccessControl.discriminator('Verified Asset Access Control', verifiedSchema),
    UserAssetControl: AssetAccessControl.discriminator('User Asset Access Control', userSchema)
};
const mongoose = require('mongoose');

const aclSchema = new mongoose.Schema({
    file_name: {
        type: String,
        required: true,
    },
    file_size: {
        type: Number,
        required: true
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
    permissions: {
        type: Map,
        of: [String],
        default: {
            admin: 'write',
            user: 'read'
        }
    },
    date_uploaded: {
        type: Date,
        default: () => Date.now()
    }
},{ collection: 'access-control' });

module.exports = mongoose.model('Access Control', aclSchema);
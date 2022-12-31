const mongoose = require('mongoose');

const toolSchema = new mongoose.Schema({
    name: {
        type: String,
        maxLength: 30,
        required: true,
    },
    description: {
        type: String,
        maxLength: 280,
    },
    user: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true,
    }
}, { collection: 'user-tools' });

module.exports = mongoose.model("tools", toolSchema);
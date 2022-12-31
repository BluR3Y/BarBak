const mongoose = require('mongoose');

const drinkwareSchema = new mongoose.Schema({
    name: {
        type: String,
        maxLength: 30,
        required: true
    },
    description: {
        type: String,
        maxLength: 280,
    },
    user: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true,
    }
}, { collection: 'user-drinkware' });

module.exports = mongoose.model("user-drinkware", drinkwareSchema);
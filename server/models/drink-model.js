const mongoose = require('mongoose');

const drinkSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    type: {
        type: String,
    },
}, { collection: 'user-drinks' });

module.exports = mongoose.model("user-drinks", drinkSchema);
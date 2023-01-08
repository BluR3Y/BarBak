const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    customerId: {
        type: String,
        required: true
    },
    apiKey: {
        type: String,
        required: true,
    }
}, { collection: 'customers' });

module.exports = mongoose.model("customer", customerSchema);
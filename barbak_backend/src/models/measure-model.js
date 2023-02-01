const mongoose = require('mongoose');

const measureSchema = new mongoose.Schema({
    name: {
        type: String,
        lowercase: true,
        required: true,
    },
    abbriviation: {
        type: String,
        lowercase: true,
    },
    standardized: {
        type: Boolean,
        required: true,
    }
},{ collection: 'measurements' });

module.exports = mongoose.model("Measure", measureSchema);
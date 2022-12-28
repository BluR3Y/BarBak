const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        minLength: 6,
        maxLength: 50
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
        minLength: 6,
    },
    registration_date: {
        type: Date,
        immutable: true,
        default: () => Date.now(),
    }
});

module.exports = mongoose.model("User", userSchema);
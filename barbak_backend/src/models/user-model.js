const mongoose = require('mongoose');
const { scryptSync, randomBytes, timingSafeEqual } = require('crypto');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        minLength: 6,
        maxLength: 30
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
}, { collection: 'users' });

userSchema.statics.hashPassword = async function(password) {
    // A random value added to the hashed password making it harder to guess
    const salt = randomBytes(16).toString('hex');
    const hashedPassword = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hashedPassword}`;
}

userSchema.methods.validatePassword = async function(attempt) {
    const storedPassword = this.password;
    const [salt,key] = storedPassword.split(':');
    const hashedBuffer = scryptSync(attempt, salt, 64);

    // Prevents 'Timing Attacks'
    const keyBuffer = Buffer.from(key, 'hex');
    const match = timingSafeEqual(hashedBuffer, keyBuffer);

    return match;
}

module.exports = mongoose.model("user", userSchema);
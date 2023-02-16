const mongoose = require('mongoose');
const { scryptSync, randomBytes, timingSafeEqual, randomInt } = require('crypto');

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
    fullname: {
        type: String,
        lowercase: true,
        default: null,
    },
    password: {
        type: String,
        required: true,
        minLength: 6,
    },
    profile_image: {
        type: String,
        default: null
    },
    experience: {
        type: String,
        lowercase: true,
        default: 'novice',
        enum: [ "novice", "experienced", "expert" ]
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    registration_date: {
        type: Date,
        immutable: true,
        default: () => Date.now(),
    }
}, { collection: 'users' });

userSchema.statics.hashPassword = function(password) {
    // A random value added to the hashed password making it harder to guess
    const salt = randomBytes(16).toString('hex');
    const hashedPassword = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hashedPassword}`;
}

userSchema.statics.generateVerificationCode = function() {
    const code = randomInt(100000, 999999);
    return code.toString();
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

userSchema.methods.customValidate = async function() {
    const error = new Error();
    error.name = "CustomValidationError";
    error.errors = [];

    if (await this.model('User').findOne({ username: this.username }))
        error.errors['username'] = "exist";
    if (await this.model('User').findOne({ email: this.email }))
        error.errors['email'] = "exist";

    if (Object.keys(error.errors).length)
        throw error;0
}

userSchema.methods.getPublicInfo = function() {
    const { _id, username, email, profile_image, experience } = this;
    return {
        _id,
        username,
        email,
        fullname,
        profile_image,
        experience
    };
}

module.exports = mongoose.model("User", userSchema);
const mongoose = require('mongoose');
const { scryptSync, randomBytes, timingSafeEqual, randomInt, createCipher, createDecipher, createCipheriv, createDecipheriv } = require('crypto');
const { redisClient } = require('../config/database-config');
const transporter = require('../config/nodemailer-config');

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

userSchema.statics.encryptData = function(plainData) {
    // Generate a random encryption key
    const encryptionKey = randomBytes(32);

    // Generate a random initialization vector
    const iv = randomBytes(16);

    // Create a cipher object using the encryption key and iv
    const cipher = createCipheriv('aes-256-cbc', encryptionKey, iv);

    // Encrypt the information using the cipher object
    let encryptedData = cipher.update(plainData, 'utf8', 'hex');
    encryptedData += cipher.final('hex');

    return { encryptionKey, iv, encryptedData };
}

userSchema.statics.decryptData = function(encryptionKey, iv, encryptedData) {
    if (typeof encryptionKey === 'object')
        encryptionKey = Buffer.from(encryptionKey);
    if (typeof iv === 'object')
        iv = Buffer.from(iv);

    // Create a decipher object using the encryption key
    const decipher = createDecipheriv('aes-256-cbc', encryptionKey, iv);

    // Decrypt the data using the decipher object
    let decryptedData = decipher.update(encryptedData, 'hex', 'utf8');
    decryptedData += decipher.final('utf8');

    return decryptedData;
}

userSchema.statics.sendRegistrationCode = async function(sessionId, email) {
    var registrationCode = randomInt(100000, 999999);
    
    const codeDuration = 60 * 10;   // Code lasts 10 minutes
    const mailOptions = {
        from: 'noreply@barbak.com',
        to: email,
        subject: 'Registration Code',
        text: `The registration code for your BarBak account is: ${registrationCode}`
    };

    await redisClient.setEx(`registration-code:${sessionId}`, codeDuration, registrationCode.toString());
    await transporter.sendMail(mailOptions);
}

userSchema.statics.validateRegistrationCode = async function(sessionId, registrationCode) {
    const redisRes = await redisClient.get(`registration-code:${sessionId}`);
    const validation = registrationCode === redisRes;

    if (validation)
        await redisClient.del(`registration-code:${sessionId}`);

    return validation;
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
        throw error;
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

userSchema.methods.getPublicInfo = function() {
    const { _id, username, fullname, email, profile_image, experience } = this;
    return {
        _id,
        username,
        fullname,
        email,
        profile_image,
        experience
    };
}

module.exports = mongoose.model("User", userSchema);
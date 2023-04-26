const mongoose = require('mongoose');
const { AppRole } = require('./roles-model');
const { randomBytes, scryptSync,timingSafeEqual, randomInt } = require('crypto');
const { redisClient } = require('../config/database-config');
const emailQueue = require('../lib/queue/email-queue');
const { default_covers } = require('../config/config.json');

const durationSchema = new mongoose.Schema({
    start: {
        type: Date,
        required: true
    },
    end: {
        type: Date,
        required: true
    },
    active: {
        type: Boolean,
        default: false
    }
});

// Validate duration to disable 'end' if active true

const experienceSchema = new mongoose.Schema({
    position: {
        type: String,
        required: true,
        maxlength: 30
    },
    workplace: {
        type: String,
        required: true,
        maxlength: 40
    },
    bar_type: {
        type: String
    },
    location: {
        type: String,
        required: true
    },
    duration: durationSchema
});

const achievementSchema = new mongoose.Schema({
    description: {
        type: String,
        minlength: 50,
        maxlength: 600,
        required: true
    },
    location: {
        type: String,
        maxlength: 30,
        required: true
    },
    duration: durationSchema
});

const educationSchema = new mongoose.Schema({
    name: {
        type: String,
        maxlength: 30,
        required: true
    },
    institute: {
        type: String,
        maxlength: 30,
        required: true
    },
    location: {
        type: String,
        maxlength: 30,
        required: true
    },
    duration: durationSchema
});

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        minlength: 6,
        maxlength: 30,
        required: true,
        lowercase: true
    },
    fullname: {
        type: String,
        maxlength: 30,
        lowercase: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    about_me: {
        type: String,
        maxlength: 600
    },
    profile_image: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File Access Control',
        default: null
    },
    experience: {
        type: [experienceSchema],
        validate: {
            validator: function(items) {
                return items?.length <= 20;
            },
            message: 'Number of experience items has been exceeded'
        }
    },
    achievements: {
        type: [achievementSchema],
        validate: {
            validator: function(items) {
                return items?.length <= 20;
            },
            message: 'Number of achievements has been exceeded'
        }
    },
    education: {
        type: [educationSchema],
        validate: {
            validator: function(items) {
                return items?.length <= 20;
            },
            message: 'Number of certificates has been exceeded'
        }
    },
    skills: {
        type: [String],
        validate: {
            validator: function(items) {
                return items?.length <= 20;
            },
            message: 'Number of skills has been exceeded'
        }
    },
    interests: {
        type: [String],
        validate: {
            validator: function(items) {
                return items?.length <= 5;
            },
            message: 'Number of interests has been exceeded'
        }
    },
    public: {
        type: Boolean,
        default: false
    },
    expertise_level: {
        type: String,
        default: 'novice',
        enum: ['novice', 'intermediate', 'expert']
    },
    role: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'App Role',
        default: '6447797f01eba11f622d6a6b'
    },
    date_registered: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    }
} , { collection: 'users' });

userSchema.path('username').validate(async function(username) {
    return (!await this.constructor.exists({ username }));
}, 'Username already associated with another account', 'exist');

userSchema.path('email').validate(async function(email) {
    return (!await this.constructor.exists({ email }));
}, 'Email already associated with another account', 'exist');

userSchema.path('role').validate(async function(role) {
    return (await AppRole.exists({ _id: role }));
}, 'Invalid user role');

userSchema.virtual('profile_image_url').get(function() {
    const { HOSTNAME, PORT, HTTP_PROTOCOL } = process.env;
    let filepath;
    if (this.profile_image) 
        filepath = 'assets/' + this.profile_image;
    else
        filepath = default_covers['user'] ? 'assets/default/' + default_covers['user'] : null;
    
    return filepath ? `${HTTP_PROTOCOL}://${HOSTNAME}:${PORT}/${filepath}` : null;
});

userSchema.virtual('role_info', {
    ref: 'App Role',
    localField: 'role',
    foreignField: '_id',
    justOne: true
});

userSchema.statics.hashPassword = function(password) {
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

userSchema.statics.sendRegistrationCode = async function(sessionId, email) {
    const registrationCode = randomInt(100000, 999999);
    const codeDuration = 60 * 15;   // Code lasts 15 minutes
    const mailOptions = {
        recipients: email,
        subject: 'Registration Code',
        content: `<h1>The registration code for your BarBak account is: ${registrationCode}</h1>`
    };
    await redisClient.setEx(`registration-code:${sessionId}`, codeDuration, registrationCode.toString());
    await emailQueue(mailOptions);
}

userSchema.statics.validateRegistrationCode = async function(sessionId, registrationCode) {
    const redisRes = await redisClient.get(`registration-code:${sessionId}`);
    const validation = registrationCode === redisRes;

    if (validation)
        await redisClient.del(`registration-code:${sessionId}`);

    return validation;
}

module.exports = mongoose.model('User', userSchema);
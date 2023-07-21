const mongoose = require('mongoose');
const { randomBytes, scryptSync,timingSafeEqual, randomInt } = require('crypto');
const { redisClient, executeSqlQuery } = require('../config/database-config');
const emailQueue = require('../lib/queue/send-email');
const s3FileRemoval = require('../lib/queue/remove-s3-file');
const { default_covers, user_roles } = require('../config/config.json');
const { accessibleFieldsPlugin } = require('@casl/mongoose');
const { getPreSignedURL } = require('../utils/aws-s3-operations');

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
        lowercase: true,
        unique: true
    },
    fullname: {
        type: String,
        maxlength: 30,
        lowercase: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true
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
        type: String,
        default: null
    },
    experience: {
        type: [experienceSchema],
        validate: {
            validator: (items) => items && items.length <= 20,
            message: 'Number of experience items has been exceeded'
        }
    },
    achievements: {
        type: [achievementSchema],
        validate: {
            validator: (items) => items && items.length <= 20,
            message: 'Number of achievements has been exceeded'
        }
    },
    education: {
        type: [educationSchema],
        validate: {
            validator: (items) => items && items.length <= 20,
            message: 'Number of certificates has been exceeded'
        }
    },
    skills: {
        type: [String],
        validate: {
            validator: (items) => items && items.length <= 20,
            message: 'Number of skills has been exceeded'
        }
    },
    interests: {
        type: [String],
        validate: {
            validator: (items) => items && items.length <= 5,
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
        type: Number,
        enum: Object.values(user_roles),
        default: user_roles.standard
    },
    date_registered: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    }
} , { collection: 'users' });

userSchema.plugin(accessibleFieldsPlugin, {
    // Adding a plugin to the schema that will prevent access to unauthorized field
    getFields: (schema) => Object.keys({
        ...schema.paths,
        ...schema.virtuals
    })
});

userSchema.path('username').validate(async function(username) {
    return (!await this.constructor.exists({ username, _id: { $ne: this._id } }));
}, 'Username already associated with another account', 'exist');

userSchema.path('email').validate(async function(email) {
    return (!await this.constructor.exists({ email, _id: { $ne: this._id } }));
}, 'Email already associated with another account', 'exist');

userSchema.pre('save', async function(next) {
    const { profile_image } = await this.constructor.findById(this._id) || {};
    const modifiedFields = this.modifiedPaths();

    if (modifiedFields.includes('profile_image') && profile_image)
        await s3FileRemoval({ filepath: profile_image });
    
    next();
});

userSchema.path('role').validate(async function(role) {
    const [{ roleCount }] = await executeSqlQuery(`
        SELECT COUNT(*) AS roleCount
        FROM user_roles
        WHERE id = ?
        LIMIT 1;
    `, [role]);
    return !!roleCount;
}, 'Invalid role assigned to user', 'valid');

userSchema.virtual('role_info').get(async function() {
    const [{ id, name }] = await executeSqlQuery(`
        SELECT
            id, name
        FROM user_roles
        WHERE id = ?
        LIMIT 1;
    `, [this.role]);
    return { id, name };
});

userSchema.virtual('profile_image_url').get(async function() {
    return (await getPreSignedURL(this.profile_image || default_covers.user));
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

// Helps authenticator determine resource type
userSchema.statics.__resourceType = function() {
    return 'users';
}

module.exports = mongoose.model('User', userSchema);
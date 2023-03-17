const mongoose = require('mongoose');
const { randomBytes, scryptSync,timingSafeEqual, randomInt } = require('crypto');
const { redisClient } = require('../config/database-config');
const transporter = require('../config/nodemailer-config');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        minlength: [6, 'Username must contain at least 6 characters'],
        maxlength: [30, 'Username length must not exceed 30 characters'],
        required: [true, 'Username is required'],
        lowercase: true
    },
    fullname: {
        type: String,
        maxlength: [30, 'Name must not exceed 30 characters'],
        lowercase: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
    },
    about_me: {
        type: String,
        maxlength: [600, 'About me must not exceed 600 characters']
    },
    profile_image: {
        type: String,
        default: null
    },
    experience: {
        type: [{
            position: {
                type: String,
                required: [true, 'Job position is required'],
                maxlength: [30, 'Job position must not exceed 30 characters']
            },
            workplace: {
                type: String,
                required: [true, 'Workplace field is required'],
                minlength: [6, 'Workplace must contain at least 6 characters'],
                maxlength: [40, 'Workplace must not exceed 40 characters']
            },
            bar_type: {
                type: String,
            },
            location: {
                type: String,
                required: [true, 'Location field is required'],
                maxlength: [30, 'Location exceeds character limit']
            },
            duration: {
                type: {
                    start: {
                        type: Date,
                        required: [true, 'Start date is required']
                    },
                    end: {
                        type: Date,
                        default: null,
                    }
                },
                required: [true, 'Position duration is required']
            }
        }],
        validate: {
            validator: function(items) {
                return items && items.length <= 20;
            },
            message: 'Number of work experience items has been exceeded'
        }
    },
    achievements: {
        type: [{
            description: {
                type: String,
                minlength: [50, 'Description must contain at least 50 characters'],
                maxlength: [600, 'Description has exceeded character limit'],
                required: [true, 'Description is required']
            },
            location: {
                type: String,
                maxlength: [30, 'Location exceeds character limit'],
                required: [true, 'Location is required']
            },
            duration: {
                type: {
                    start: {
                        type: Date,
                        required: [true, 'Start date is required'],
                    },
                    end: {
                        type: Date,
                        default: null
                    }
                },
                required: [true, 'Milestone duration is required']
            }
        }],
        validate: {
            validator: function(items) {
                return items && items.length <= 20;
            },
            message: 'Number of achievements has been exceeded'
        }
    },
    education: {
        type: [{
            name: {
                type: String,
                maxlength: [30, 'Certificate name exceeds character limit'],
                required: [true, 'Certificate name is required']
            },
            institute: {
                type: String,
                maxlength: [30, 'Institute name exceeds character limit'],
                required: [true, 'Institute name is required']
            },
            location: {
                type: String,
                maxlength: [30, 'Location exceeds character limit'],
                required: [true, 'Location is required']
            },
            duration: {
                type: {
                    start: {
                        type: Date,
                        required: [true, 'Start date is required'],
                    },
                    end: {
                        type: Date,
                        default: null
                    }
                },
                required: [true, 'Certification duration is required']
            }
        }],
        validate: {
            validator: function(items) {
                return items && items.length <= 20;
            },
            message: 'Number of certificates has been exceeded'
        },
    },
    skills: {
        type: [String],
        validate: {
            validator: function(items) {
                return items && items.length <= 20;
            },
            message: 'Number of skills has been exceeded'
        }
    },
    interests: {
        type: [String],
        validate: {
            validator: function(items) {
                return items && items.length <= 5;
            },
            message: 'Number of interests has been exceeded'
        }
    },
    public: {
        type: Boolean,
        default: true
    },
    expertise: {
        type: String,
        default: 'novice',
        enum: ['novice', 'intermediate', 'expert']
    },
    role: {
        type: String,
        enum: ['admin', 'editor', 'user'],
        default: 'user'
    },
    date_registered: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    }
},{ collection: 'users' });

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

userSchema.methods.getBasicInfo = function() {
    var { _id, username, fullname, profile_image, expertise } = this;

    profile_image = `${process.env.HOST_URI}/${profile_image ? profile_image : 'assets/default/profile_image.png'}`;

    return { _id, username, fullname, profile_image, expertise };
}

userSchema.methods.getExtendedInfo = function() {
    var { _id, username, fullname, email, profile_image, expertise, date_registered } = this;

    profile_image = `${process.env.HOST_URI}/${profile_image ? profile_image : 'assets/default/profile_image.png'}`;

    return { _id, username, fullname, email, profile_image, expertise, date_registered };
}

module.exports = mongoose.model('User', userSchema);
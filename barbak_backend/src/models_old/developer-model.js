const mongoose = require('mongoose');
const { randomBytes, createHash } = require('crypto');

const developerSchema = new mongoose.Schema({
    name: {
        type: String,
        maxLength: 30,
        required: true,
    },
    email: {
        type: String,
        lowercase: true,
        required: true,
    },
    link: {
        type: String,
        lowercase: true,
        maxLength: 50,
    },
    statement: {
        type: String,
        maxLength: 500,
        required: true,
    },
    // subscription: {
    //     type: String,
    //     lowercase: true,
    //     default: 'free',
    //     enum: {
    //         values: ['free', 'business'],
    //         message: props => `${props.value} is not a valid 'subscription' state`,
    //     },
    //     required: true,
    // },
    user: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "User",
        required: true,
        immutable: true,
    },
    apiKey: {
        type: String,
    },
    registrationDate: {
        type: Date,
        immutable: true,
        default: () => Date.now(),
        required: true,
    }
}, { collection: 'developers' });

developerSchema.statics.generateAPIKey = async function() {
    const apiKey = randomBytes(16).toString('hex');
    const hashedAPIKey = createHash('md5').update(apiKey).digest('hex');

    if(await this.findOne({ apiKey: hashedAPIKey }))
        this.generateAPIKey();
    else
        return { apiKey, hashedAPIKey }; 
};

developerSchema.methods.customValidate = async function() {
    const error = new Error();
    error.name = "CustomValidationError";
    error.errors = {};
    
    if (await this.model('Developer').findOne({ email: this.email, user: { $ne: this.user._id } }))
        error.errors['email'] = "exist";
    if (await this.model('Developer').findOne({ link: this.link, user: { $ne: this.user._id } }))
        error.errors['link'] = "exist";
    
    if (Object.keys(error.errors).length)
        throw error;
}

module.exports = mongoose.model("Developer", developerSchema);
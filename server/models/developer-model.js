const mongoose = require('mongoose');
const developerValidators = require('../validators/developer-validators');

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
    host: {
        type: String,
        lowercase: true,
        maxLength: 50,
    },
    statement: {
        type: String,
        maxLength: 500,
        required: true,
    },
    subscription: {
        type: String,
        lowercase: true,
        default: 'free',
        enum: {
            values: ['free', 'business'],
            message: props => `${props.value} is not a valid 'subscription' state`,
        },
        required: true,
    },
    apiKey: {
        type: String,
        required: true,
    },
    registrationDate: {
        type: Date,
        immutable: true,
        default: () => Date.now(),
        required: true,
    },
    startCycleDay: {
        type: Number,
        default: () => {
            const date = new Date.now();
            return date.getDate();
        },
        required: true,
    }
}, { collection: 'developers' });

const callLogSchema = new mongoose.Schema({
    developer: {
        type: mongoose.SchemaTypes.ObjectId,
        immutable: true,
        required: true,
    },
    requestDate: {
        type: Date,
        immutable: false,
        default: () => Date.now(),
        required: true,
    }
}, { collection: 'call-logs' });
const CallLog = mongoose.model("call-log", callLogSchema);

developerSchema.statics.registerValidator = function(data) {
    return developerValidators.registerDeveloperSchema.validate(data);
}

developerSchema.statics.generateAPIKey = async function() {
    const { randomBytes, createHash } = require('crypto');
    const apiKey = randomBytes(16).toString('hex');
    const hashedAPIKey = createHash('md5').update(apiKey).digest('hex');

    if(await this.findOne({ api_key: hashedAPIKey }))
        this.generateAPIKey();
    else
        return { apiKey, hashedAPIKey }; 
};

developerSchema.statics.hashAPIKey = function(apiKey) {
    const { createHash } = require('crypto');
    return createHash('md5').update(apiKey).digest('hex');
}

developerSchema.methods.createCallLog = function() {
    const developerId = this._id;
    try {
        CallLog.create({
            developer: developerId
        });
    } catch (err) {
        throw err;
    }
}

developerSchema.methods.numLifetimeCalls = async function() {
    const developerId = this._id;
    return await CallLog.count({ developer: developerId });
}

developerSchema.methods.exceedsMonthlyCallLimit = async function() {
    const developerId = this._id;
    const limit = (this.subscription === 'free' ? 10 : 50);
    return false;
}

module.exports = mongoose.model("developer", developerSchema);
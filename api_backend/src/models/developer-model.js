const mongoose = require('mongoose');
// developer validators

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

// *** missing developer validators

// Model static member functions

developerSchema.statics.hashAPIKey = function(apiKey) {
    const { createHash } = require('crypto');
    return createHash('md5').update(apiKey).digest('hex');
}

// Model objects methods 

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

developerSchema.methods.countRequests = async function() {
    const developerId = this._id;
    const numRequests = await CallLog.count({ developer: developerId });
    return numRequests;
}

module.exports = mongoose.model("developer", developerSchema);
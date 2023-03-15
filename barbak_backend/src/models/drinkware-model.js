const mongoose = require('mongoose');

const Drinkware = mongoose.model('Drinkware', new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        minlength: [3, 'Name length must be at least 3 characters long'],
        maxlength: [30, 'Name length must be at most 30 characters long']
    },
    description: {
        type: String,
        maxlength: [600, 'Description length must be at most 600 characters long']
    },
    cover: {
        type: String,
        default: null
    }
},{ collection: 'drinkware', discriminatorKey: 'model' }));

Drinkware.schema.methods.getBasicInfo = function() {
    const { _id, name, description, cover } = this;
    return { _id, name, description, cover };
}

const verifiedSchema = new mongoose.Schema({
    date_verified: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    }
});

const userSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        immutable: true
    },
    privacy: {
        type: String,
        enum: ['private', 'public'],
        required: true,
        default: 'private'
    },
    date_created: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    }
});

module.exports = {
    Drinkware,
    VerifiedDrinkware: Drinkware.discriminator('Verified Drinkware', verifiedSchema),
    UserDrinkware: Drinkware.discriminator('User Drinkware', userSchema)
};
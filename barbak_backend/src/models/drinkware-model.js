const mongoose = require('mongoose');
const { default_covers } = require('../config/config.json');

const drinkwareSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 30
    },
    description: {
        type: String,
        maxlength: 600,
    },
    cover: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File Access Control',
        default: null
    }
},{ collection: 'drinkware', discriminatorKey: 'model' });

drinkwareSchema.virtual('verified').get(function() {
    return this instanceof VerifiedDrinkware;
});

drinkwareSchema.virtual('cover_url').get(function() {
    const { HOSTNAME, PORT, HTTP_PROTOCOL } = process.env;
    let filepath;
    if (this.cover) 
        filepath = 'assets/' + this.cover;
    else
        filepath = default_covers['tools'] ? 'assets/default/' + default_covers['tools'] : null;

    return filepath ? `${HTTP_PROTOCOL}://${HOSTNAME}:${PORT}/${filepath}` : null;
});

const Drinkware = mongoose.model('Drinkware', drinkwareSchema);

const verifiedSchema = new mongoose.Schema({
    date_verified: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    }
});

const VerifiedDrinkware = Drinkware.discriminator('Verified Drinkware', verifiedSchema);

const userSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        immutable: true
    },
    public: {
        type: Boolean,
        default: false,
    },
    date_created: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    }
});

const UserDrinkware = Drinkware.discriminator('User Drinkware', userSchema);

// Make Public Function

module.exports = {
    Drinkware,
    VerifiedDrinkware,
    UserDrinkware
};
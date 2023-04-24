const mongoose = require('mongoose');
const { default_covers } = require('../config/config.json');

const Drinkware = mongoose.model('Drinkware', new mongoose.Schema({
    name: {
        type: String,
        minlength: 3,
        maxlength: 30,
        required: true,
    },
    description: {
        type: String,
        maxlength: 600,
    },
    cover: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asset Access Control',
        default: null
    }
},{ collection: 'drinkware', discriminatorKey: 'variant' }));

Drinkware.schema.virtual('verified').get(function() {
    return (this instanceof this.model('Verified Drinkware'));
});

Drinkware.schema.virtual('cover_url').get(function() {
    const { HOSTNAME, PORT, HTTP_PROTOCOL } = process.env;
    let filepath;

    if (this.cover) 
        filepath = 'assets/' + this.cover;
    else
        filepath = default_covers['drinkware'] ? 'assets/default/' + default_covers['drinkware'] : null;

    return filepath ? `${HTTP_PROTOCOL}://${HOSTNAME}:${PORT}/${filepath}` : null;
});

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

module.exports = {
    Drinkware,
    VerifiedDrinkware: Drinkware.discriminator('Verified Drinkware', verifiedSchema),
    UserDrinkware: Drinkware.discriminator('User Drinkware', userSchema)
};
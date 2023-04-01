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
},{ collection: 'drinkware', discriminatorKey: 'model' });

drinkwareSchema.virtual('cover_url').get(function() {
    const { HOSTNAME, PORT, NODE_ENV } = process.env;
    const verified = this.model === 'Verified Drinkware';
    let filepath;

    if (verified && this.cover) 
        filepath = this.cover;
    else if (!verified && this.cover_acl)
        filepath = 'assets/private/' + this.cover_acl;
    else 
        filepath = default_covers['drinkware'] ? 'assets/default/' + default_covers['drinkware'] : null;

    return filepath ? `${NODE_ENV === 'production' ? 'https' : 'http'}://${HOSTNAME}:${PORT}/${filepath}` : filepath;
});

drinkwareSchema.virtual('verified').get(function() {
    return this instanceof VerifiedDrinkware;
});

drinkwareSchema.methods.responseObject = function(fields) {
    const fieldMap = {
        'id': '_id',
        'cover': 'cover_url',
    };
    const resObject = {};

    for (const key of fields) {
        const fieldName = fieldMap[key] || key;
        
        if (fieldName in this)
            resObject[key] = this[fieldName];
    }

    return resObject;
}

const Drinkware = mongoose.model('Drinkware', drinkwareSchema);

const verifiedSchema = new mongoose.Schema({
    cover: {
        type: String,
        default: null
    },
    date_verified: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    }
});

const VerifiedDrinkware = Drinkware.discriminator('Verified Drinkware', verifiedSchema);

const userSchema = new mongoose.Schema({
    cover_acl: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'App Access Control',
        default: null
    },
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
const mongoose = require('mongoose');
const s3FileRemoval = require('../lib/queue/remove-s3-file');
const { default_covers } = require('../config/config.json');
const { getPreSignedURL } = require('../utils/aws-s3-operations');
const barwarePlugin = require('./plugins/barware');

const drinkwareSchema = new mongoose.Schema({
    name: {
        type: String,
        minlength: 3,
        maxlength: 30,
        required: true
    },
    description: {
        type: String,
        maxlength: 600
    },
    cover: {
        type: String,
        default: null
    },
    date_created: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    }
},{ collection: 'drinkware', discriminatorKey: 'variant' });
drinkwareSchema.plugin(barwarePlugin);

drinkwareSchema.path('name').validate(async function(name) {
    return (!await this.constructor.exists({
        name,
        _id: { $ne: this._id },
        ...(!this.verified ? { user: this.user } : {})
    }));
}, 'Name is already associated with another drinkware');

drinkwareSchema.virtual('verified').get(function() {
    return (this instanceof this.model('Verified Drinkware'));
});

drinkwareSchema.virtual('cover_url').get(async function() {
    return (await getPreSignedURL(this.cover || default_covers.drinkware));
});

drinkwareSchema.pre('save', async function(next) {
    const { cover } = await this.constructor.findById(this._id) || {};
    const modifiedFields = this.modifiedPaths();

    if (modifiedFields.includes('cover') && cover)
        await s3FileRemoval({ filepath: cover });
    next();
});

drinkwareSchema.pre('remove', async function(next) {
    if (this.cover)
        await s3FileRemoval({ filepath: this.cover });
    next();
});

drinkwareSchema.statics.__resourceType = function() {
    return 'drinkware';
}

const Drinkware = mongoose.model('Drinkware', drinkwareSchema);

const verifiedSchema = new mongoose.Schema();

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
    }
});

module.exports = {
    Drinkware,
    VerifiedDrinkware: Drinkware.discriminator('Verified Drinkware', verifiedSchema),
    UserDrinkware: Drinkware.discriminator('User Drinkware', userSchema)
};
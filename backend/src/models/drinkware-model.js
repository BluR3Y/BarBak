const mongoose = require('mongoose');
const s3FileRemoval = require('../lib/queue/remove-s3-file');
const { default_covers } = require('../config/config.json');
const { getPreSignedURL } = require('../utils/aws-s3-operations');
const barwarePlugin = require('./plugins/barware');

const drinkwareNameSchema = new mongoose.Schema({
    primary: {
        type: String,
        minlength: 3,
        maxlength: 30,
        required: true
    },
    alternative: {
        type: [{
            type: String,
            minlength: 3,
            maxlength: 30
        }]
    },
    _id: false
});

drinkwareNameSchema.path('primary').validate(async function(name) {
    const { constructor, _id, verified, user } = this.ownerDocument();
    return (!await constructor.exists({
        _id: { $ne: _id },
        'names.primary': name,
        ...(!verified && { user })
    }));
}, 'Name is already associated with another drinkware', 'ALREADY_EXIST');

drinkwareNameSchema.path('alternative').validate(function(altNames) {
    const baseDocument = this.ownerDocument();
    if (altNames.length > 5) {
        return baseDocument.invalidate('names.alternative', 'A drinkware can only be assigned a maximum of 5 alternative names');
    }
    const nameCounter = new Map([
        [this.primary, 1]
    ]);
    for (const name of altNames) {
        nameCounter.set(name, (nameCounter.has(name) ? nameCounter.get(name) : 0) + 1);
    }
    const duplicates = [...nameCounter]
        .reduce((arr, [name, count]) => ([
            ...arr,
            ...(count > 1 ? [name] : [])
        ]), []);
    if (duplicates.length) {
        return baseDocument.invalidate('names.alternative', 'Each alternative name must be unique', duplicates, 'NOT_UNIQUE');
    }
});

const drinkwareSchema = new mongoose.Schema({
    names: {
        type: drinkwareNameSchema,
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

drinkwareSchema.virtual('verified').get(function() {
    return (this instanceof this.model('Verified Drinkware'));
});

drinkwareSchema.virtual('cover_url').get(async function() {
    return (await getPreSignedURL(this.cover || default_covers.drinkware));
});

drinkwareSchema.pre('save', async function(next) {
    const { cover } = await this.constructor.findById(this._id) || {};
    const modifiedFields = this.modifiedPaths();

    if (modifiedFields.includes('cover') && cover) {
        await s3FileRemoval({ filepath: cover });
    }
    next();
});

drinkwareSchema.pre('remove', async function(next) {
    if (this.cover) {
        await s3FileRemoval({ filepath: this.cover });
    }
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
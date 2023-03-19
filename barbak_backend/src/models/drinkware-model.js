const mongoose = require('mongoose');
const fileOperations = require('../utils/file-operations');

function formatCoverImage(filepath) {
    const { HOSTNAME, PORT } = process.env;
    if (!filepath) {
        const defaultCover = fileOperations.findByName('static/default', 'drinkware_cover');
        filepath = defaultCover ? `assets/default/${defaultCover}` : null;
    }
    return filepath ? `http://${HOSTNAME}:${PORT}/${filepath}` : filepath;
}

const drinkwareSchema = new mongoose.Schema({
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
},{ collection: 'drinkware', discriminatorKey: 'model' });

drinkwareSchema.query.basicInfo = function() {
    return new Promise((resolve, reject) => {
        this.exec(function(err, documents) {
            if (err)
                return reject(err);
            resolve(documents.map(doc => doc.extendedStripExcess()));
        });
    });
}

drinkwareSchema.query.extendedInfo = function() {
    return new Promise((resolve, reject) => {
        this.exec(function(err, documents) {
            if (err)
                return reject(err);
            resolve(documents.map(doc => doc.basicStripExcess()));
        });
    });
}

drinkwareSchema.query.conditionalSearch = function(user) {
    return this.where(user ? { $or: [{ model: 'Verified Drinkware' },{ user: user._id },{ public: true }] } : { model: 'Verified Drinkware' },{ public: true });
}

const Drinkware = mongoose.model('Drinkware', drinkwareSchema);

const verifiedSchema = new mongoose.Schema({
    date_verified: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    }
});

verifiedSchema.methods = {
    basicStripExcess: function() {
        return {
            _id: this._id,
            name: this.name,
            description: this.description,
            cover: formatCoverImage(this.cover),
            date_verified: this.date_verified
        };
    },
    extendedStripExcess: function() {
        return {
            _id: this._id,
            name: this.name,
            description: this.description,
            cover: formatCoverImage(this.cover),
        };
    }
}

const userSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        immutable: true
    },
    public: {
        type: Boolean,
        required: true,
        default: false,
    },
    date_created: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    }
});

userSchema.methods = {
    basicStripExcess: function() {
        return {
            _id: this._id,
            user: this.user,
            name: this.name,
            description: this.description,
            cover: formatCoverImage(this.cover),
            date_created: this.date_created,
            public: this.public
        };
    },
    extendedStripExcess: function() {
        return {
            _id: this._id,
            user: this.user,
            name: this.name,
            description: this.description,
            cover: formatCoverImage(this.cover)
        };
    }
}

// Make Public Function

module.exports = {
    Drinkware,
    VerifiedDrinkware: Drinkware.discriminator('Verified Drinkware', verifiedSchema),
    UserDrinkware: Drinkware.discriminator('User Drinkware', userSchema)
};
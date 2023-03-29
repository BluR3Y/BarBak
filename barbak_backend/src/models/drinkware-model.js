const mongoose = require('mongoose');
const fileOperations = require('../utils/file-operations');

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

drinkwareSchema.statics.formatCoverImage = function(filepath) {
    const { HOSTNAME, PORT } = process.env;
    if (!filepath) {
        const defaultCover = fileOperations.findByName('static/default', 'drinkware_cover');
        if (defaultCover.length)
            filepath = `assets/default/${defaultCover}`;
    }
    return filepath ? `http://${HOSTNAME}:${PORT}/${filepath}` : filepath;
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

verifiedSchema.methods = {
    basicStripExcess: function() {
        return {
            _id: this._id,
            name: this.name,
            description: this.description,
            cover: this.constructor.formatCoverImage(this.cover),
            date_verified: this.date_verified
        };
    },
    extendedStripExcess: function() {
        return {
            _id: this._id,
            name: this.name,
            description: this.description,
            cover: this.constructor.formatCoverImage(this.cover),
        };
    }
}

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

userSchema.methods = {
    basicStripExcess: function() {
        return {
            _id: this._id,
            user: this.user,
            name: this.name,
            description: this.description,
            cover: this.constructor.formatCoverImage(this.cover_acl ? `assets/private/${this.cover_acl}` : null),
            date_created: this.date_created,
            public: this.public
        };
    },
    extendedStripExcess: function() {
        return {
            _id: this._id,
            // user: this.user,
            name: this.name,
            description: this.description,
            cover: this.constructor.formatCoverImage(this.cover_acl ? `assets/private/${this.cover_acl}` : null)
        };
    }
}

// Make Public Function

module.exports = {
    Drinkware,
    VerifiedDrinkware: Drinkware.discriminator('Verified Drinkware', verifiedSchema),
    UserDrinkware: Drinkware.discriminator('User Drinkware', userSchema)
};
const mongoose = require('mongoose');

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

drinkwareSchema.post('find', function(documents, next) {
    const { HOSTNAME, PORT } = process.env;
    for (const doc of documents) 
        doc.cover = `http://${HOSTNAME}:${PORT}/` + (doc.cover ? doc.cover : 'assets/default/drinkware_cover.jpg');
    next();
});

drinkwareSchema.post('findOne', function(document, next) {
    const { HOSTNAME, PORT } = process.env;
    document.cover = `http://${HOSTNAME}:${PORT}/` + (document.cover ? document.cover : 'assets/default/drinkware_cover.jpg');
    next();
});

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
            cover: this.cover,
            date_verified: this.date_verified
        };
    },
    extendedStripExcess: function() {
        return {
            _id: this._id,
            name: this.name,
            description: this.description,
            cover: this.cover,
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
            cover: this.cover,
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
            cover: this.cover,
        };
    }
}

// Make Public Function

module.exports = {
    Drinkware,
    VerifiedDrinkware: Drinkware.discriminator('Verified Drinkware', verifiedSchema),
    UserDrinkware: Drinkware.discriminator('User Drinkware', userSchema)
};
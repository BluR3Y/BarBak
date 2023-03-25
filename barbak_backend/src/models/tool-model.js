const mongoose = require('mongoose');
const { executeSqlQuery } = require('../config/database-config');
const fileOperations = require('../utils/file-operations');

const toolSchema = new mongoose.Schema({
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
    category: {
        type: String,
        required: [true, 'Category is required']
    }
},{ collection: 'tools', discriminatorKey: 'model' });

toolSchema.query.basicInfo = function() {
    return new Promise((resolve, reject) => {
        this.exec(function(err, documents) {
            if (err)
                return reject(err);
            resolve(documents.map(doc => doc.extendedStripExcess()));
        });
    });
}

toolSchema.query.extendedInfo = function() {
    return new Promise((resolve, reject) => {
        this.exec(function(err, documents) {
            if (err)
                return reject(err);
            resolve(documents.map(doc => doc.basicStripExcess()));
        });
    });
}

toolSchema.statics = {
    formatCoverImage: function(filepath) {
        const { HOSTNAME, PORT } = process.env;
        if (!filepath) {
            const defaultCover = fileOperations.findByName('static/default', 'barwasre_cover');
            if (defaultCover.length)
                filepath = 'assets/default/' + defaultCover;
        }
        return filepath ? `http://${HOSTNAME}:${PORT}/${filepath}` : null;
    },
    getCategories: async function() {
        const categories = await executeSqlQuery('SELECT name FROM tool_categories');
        return (await categories.map(item => item.name));
    },
    validateCategories: async function(categories) {
        if (!Array.isArray(categories))
            categories = [categories];

        const errors = {};
        for (const index in categories) {
            const { categoryCount } = await executeSqlQuery('SELECT COUNT(*) AS categoryCount FROM tool_categories WHERE name = ? LIMIT 1;', [categories[index]])
                .then(res => res[0]);
            if (!categoryCount)
                errors[index] = { type: 'valid', message: 'Invalid tool category' };
        }
        const isValid = Object.keys(errors).length === 0;
        return { isValid, errors };
    }
}

toolSchema.methods.customValidate = async function() {
    const error = new Error();
    error.name = "CustomValidationError";
    error.errors = {};

    const categoryValidation = await this.constructor.validateCategories(this.category);
    if (!categoryValidation.isValid)
        error.errors['category'] = categoryValidation.errors[0];
    
    if (Object.keys(error.errors).length)
        throw error;
}

const Tool = mongoose.model('Tool', toolSchema);

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
            category: this.category,
            cover: this.constructor.formatCoverImage(this.cover),
            date_created: this.date_created
        }
    },
    extendedStripExcess: function() {
        return {
            _id: this._id,
            name: this.name,
            description: this.description,
            category: this.category,
            cover: this.constructor.formatCoverImage(this.cover)
        }
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
            category: this.category,
            cover: this.constructor.formatCoverImage(this.cover_acl ? `assets/private/${this.cover_acl}` : null),
            date_created: this.date_created,
            public: this.public
        }
    },
    extendedStripExcess: function() {
        return {
            _id: this._id,
            user: this.user,
            name: this.name,
            description: this.description,
            category: this.category,
            cover: this.constructor.formatCoverImage(this.cover_acl ? `assets/private/${this.cover_acl}` : null),
        }
    }
}

// Make Public Function

module.exports = {
    Tool,
    VerifiedTool: Tool.discriminator('Verified Tool', verifiedSchema),
    UserTool: Tool.discriminator('User Tool', userSchema)
};
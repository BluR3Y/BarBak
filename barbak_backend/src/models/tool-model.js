const mongoose = require('mongoose');
const { executeSqlQuery } = require('../config/database-config');
const { default_covers } = require('../config/config.json');

const toolSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 30,
    },
    description: {
        type: String,
        maxlength: 600,
    },
    category: {
        type: String,
        required: true,
    }
},{ collection: 'tools', discriminatorKey: 'model' });

toolSchema.query.categoryFilter = function(categories) {
    return categories.length ? this.where('category').in(categories) : this;
}

toolSchema.statics = {
    getCategories: async function() {
        const categories = await executeSqlQuery('SELECT name FROM tool_categories');
        return (await categories.map(item => item.name));
    },
    validateCategories: async function(categories) {
        const errors = {};
        if (!Array.isArray(categories))
            categories = [categories];

        await Promise.all(categories.map(async category => {
            const [{ categoryCount }] = await executeSqlQuery('SELECT COUNT(*) AS categoryCount FROM tool_categories WHERE name = ? LIMIT 1;', [category]);
            if (!categoryCount)
                errors[category] = { type: 'valid', message: 'Invalid tool category' };
        }));

        return { isValid: !Object.keys(errors).length, errors };
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

toolSchema.methods.responseObject = function(fields) {
    const fieldMap = {
        'id': '_id',
        'cover': 'cover_url'
    };
    const resObject = {};

    for (const key of fields) {
        const fieldName = fieldMap[key] || key;
        
        if (fieldName in this)
            resObject[key] = this[fieldName];
    }
    return resObject;
}

toolSchema.virtual('verified').get(function() {
    return this instanceof VerifiedTool;
});

toolSchema.virtual('cover_url').get(function() {
    const { HOSTNAME, PORT, NODE_ENV } = process.env;
    const { verified } = this;
    let filepath;

    if (verified && this.cover) 
        filepath = this.cover;
    else if (!verified && this.cover_acl)
        filepath = 'assets/private/' + this.cover_acl;
    else 
        filepath = default_covers['tool'] ? 'assets/default/' + default_covers['tool'] : null;

    return filepath ? `${NODE_ENV === 'production' ? 'https' : 'http'}://${HOSTNAME}:${PORT}/${filepath}` : filepath;
});

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

const VerifiedTool = Tool.discriminator('Verified Tool', verifiedSchema);

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

// Make Public Function

const UserTool = Tool.discriminator('User Tool', userSchema);

module.exports = {
    Tool,
    VerifiedTool,
    UserTool
};
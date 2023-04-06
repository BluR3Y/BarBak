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
    },
    cover: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File Access Control',
        default: null
    }
},{ collection: 'tools', discriminatorKey: 'model' });

toolSchema.query.categoryFilter = function(categories) {
    return categories.length ? this.where('category').in(categories) : this;
}

toolSchema.virtual('verified').get(function() {
    return this instanceof VerifiedTool;
});

toolSchema.virtual('cover_url').get(function() {
    const { HOSTNAME, PORT, HTTP_PROTOCOL } = process.env;
    let filepath;
    if (this.cover) 
        filepath = 'assets/' + this.cover;
    else
        filepath = default_covers['tools'] ? 'assets/default/' + default_covers['tools'] : null;

    return filepath ? `${HTTP_PROTOCOL}://${HOSTNAME}:${PORT}/${filepath}` : null;
});

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

const Tool = mongoose.model('Tool', toolSchema);

const verifiedSchema = new mongoose.Schema({
    date_verified: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    }
});

const VerifiedTool = Tool.discriminator('Verified Tool', verifiedSchema);

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

// Make Public Function

const UserTool = Tool.discriminator('User Tool', userSchema);

module.exports = {
    Tool,
    VerifiedTool,
    UserTool
};
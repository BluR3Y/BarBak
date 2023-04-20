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
        type: Number,
        required: true,
    },
    cover: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File Access Control',
        default: null
    }
},{ collection: 'tools', discriminatorKey: 'model' });

toolSchema.path('category').validate(async function(category) {
    if (!await this.constructor.validateCategory(category))
        return this.invalidate('category', 'Invalid category value', category, 'exist');

    return true;
});

toolSchema.virtual('verified').get(function() {
    return this instanceof VerifiedTool;
});

toolSchema.virtual('category_info').get(async function() {
    const [{ categoryName }] = await executeSqlQuery(`
        SELECT name AS categoryName
        FROM tool_categories
        WHERE id = ? LIMIT 1;
    `, [this.category]);
    return {
        id: this.category,
        name: categoryName
    };
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
        const categories = await executeSqlQuery(`
            SELECT *
            FROM tool_categories
        `);
        return (await categories.map(item => ({
            id: item.id,
            name: item.name
        })));
    },
    validateCategory: async function(categoryId) {
        const [{ categoryCount }] = await executeSqlQuery(`
            SELECT
                COUNT(*) AS categoryCount
            FROM tool_categories 
            WHERE id = ? LIMIT 1;
        `, [categoryId]);
        return !!categoryCount;
    },
    searchFilters: async function(categories) {
        const categoryValidations = await Promise.all(categories.map(item => this.validateCategory(item)));
        const invalidCategories = categories.reduce((accumulator, current, index) => ([
            ...accumulator,
            ...(!categoryValidations[index] ? [{
                category: current,
                message: 'Invalid category filter'
            }] : [])
        ]), []);
        if (invalidCategories.length) {
            const error = new Error('Invalid search filters');
            error.errors = invalidCategories;
            throw error;
        }
        return [
            ...(categories.length ? [{ 'category': { $in: categories } }] : [])
        ];
    }
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
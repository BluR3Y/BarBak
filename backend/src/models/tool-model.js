const mongoose = require('mongoose');
const { executeSqlQuery } = require('../config/database-config');
const { getPreSignedURL } = require('../utils/aws-s3-operations');
const s3FileRemoval = require('../lib/queue/remove-s3-file');
const { default_covers } = require('../config/config.json');
const barwarePlugin = require('./plugins/barware');

const toolSchema = new mongoose.Schema({
    name: {
        type: String,
        minlength: 3,
        maxlength: 30,
        required: true,
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
        type: String,
        default: null
    },
    date_created: {
        type: Date,
        default: () => Date.now()
    }
},{ collection: 'tools', discriminatorKey: 'variant' });
toolSchema.plugin(barwarePlugin);

toolSchema.path('name').validate(async function(name) {
    return (!await this.constructor.exists({
        name,
        _id: { $ne: this._id },
        ...(!this.verified ? { user: this.user } : {})
    }));
}, 'Name is already associated with another tool');

toolSchema.path('category').validate(async function(category) {
    if (!await this.constructor.validateCategory(category))
        return this.invalidate('category', 'Invalid category value', category, 'exist');

    return true;
});

toolSchema.virtual('verified').get(function() {
    return (this instanceof this.model('Verified Tool'));
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

toolSchema.virtual('cover_url').get(async function() {
    return (await getPreSignedURL(this.cover || default_covers.tool));
});

toolSchema.pre('save', async function(next) {
    const { cover } = await this.constructor.findById(this._id) || {};
    const modifiedFields = this.modifiedPaths();

    if (modifiedFields.includes('cover') && cover)
        await s3FileRemoval({ filepath: cover });
    next();
});

toolSchema.pre('remove', async function(next) {
    if (this.cover)
        await s3FileRemoval({ filepath: this.cover });
    next();
});

toolSchema.statics.getCategories = async function() {
    const categories = await executeSqlQuery(`
        SELECT *
        FROM tool_categories
    `);
    return (await categories.map(item => ({
        id: item.id,
        name: item.name
    })));
}

toolSchema.statics.validateCategory = async function(categoryId) {
    const [{ categoryCount }] = await executeSqlQuery(`
        SELECT
            COUNT(*) AS categoryCount
        FROM tool_categories 
        WHERE id = ? LIMIT 1;
    `, [categoryId]);
    return !!categoryCount;
}

toolSchema.statics.searchFilters = async function(categories) {
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

toolSchema.statics.__resourceType = function() {
    return 'tools';
}

const Tool = mongoose.model('Tool', toolSchema);

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
    Tool,
    VerifiedTool: Tool.discriminator('Verified Tool', verifiedSchema),
    UserTool: Tool.discriminator('User Tool', userSchema)
};
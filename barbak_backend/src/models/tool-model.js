const mongoose = require('mongoose');
const { executeSqlQuery } = require('../config/database-config');

const Tool = mongoose.model('Tool', new mongoose.Schema({
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
    },
    category: {
        type: String,
        required: [true, 'Category is required']
    }
},{ collection: 'tools', discriminatorKey: 'model' }));

Tool.schema.statics = {
    getCategories: async function() {
        const categories = await executeSqlQuery('SELECT name FROM tool_categories');
        return (await categories.map(item => item.name));
    },
    validateCategory: async function(category) {
        const { categoryCount } = await executeSqlQuery('SELECT COUNT(*) AS categoryCount FROM tool_categories WHERE name = ? LIMIT 1;', [category])
            .then(res => res[0]);
        return Boolean(categoryCount);
    }
}

Tool.schema.methods.customValidate = async function() {
    
}

const verifiedSchema = new mongoose.Schema({
    date_verified: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    }
});

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

userSchema.query.authorInfo = function() {
    return this.select('')
}

// Make Public Function

module.exports = {
    Tool,
    VerifiedTool: Tool.discriminator('Verified Tool', verifiedSchema),
    UserTool: Tool.discriminator('User Tool', userSchema)
};
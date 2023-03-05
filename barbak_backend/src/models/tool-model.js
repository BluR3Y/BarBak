const mongoose = require('mongoose');
const { executeSqlQuery } = require('../config/database-config');
const FileOperations = require('../utils/file-operations');

const Tool = mongoose.model("Tool", new mongoose.Schema({
    name: {
        type: String,
        minLength: [3, 'Name must be at least 3 characters long'],
        maxLength: [30, 'Name length must not exceed 30 characters'],
        required: [true , 'Tool name is required'],
    },
    description: {
        type: String,
        maxLength: [600, 'Description must not exceed 600 characters'],
    },
    category: {
        type: String,
        required: [true, 'Tool category is required']
    },
    cover: {
        type: String,
        default: null
    }
}, { collection: 'tools', discriminatorKey: 'model' }));

Tool.schema.statics = {
    getCategories: async function() {
        const categories = await executeSqlQuery('SELECT name FROM tool_categories');
        return (await categories.map(item => item.name));
    },
    validateCategory: async function(category) {
        const { categoryCount } = await executeSqlQuery('SELECT COUNT(*) AS categoryCount FROM tool_categories WHERE name = ? LIMIT 1;', [category]).then(res => res[0]);
        return Boolean(categoryCount);
    }
}

const publicToolSchema = new mongoose.Schema({
    date_published: {
        type: Date,
        required: true,
        immutable: true,
        default: () => Date.now()
    }
});

const privateToolSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        immutable: true
    },
    date_created: {
        type: Date,
        immutable: true,
        default: () => Date.now(),
    }
});


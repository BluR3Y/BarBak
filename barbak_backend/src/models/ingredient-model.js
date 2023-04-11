const mongoose = require('mongoose');
const { executeSqlQuery } = require('../config/database-config');
const { default_covers } = require('../config/config.json');

const ingredientSchema = new mongoose.Schema({
    name: {
        type: String,
        minlength: 3,
        maxlength: 30,
        required: true
    },
    description: {
        type: String,
        maxlength: 600
    },
    category: {
        type: String,
        required: true
    },
    sub_category: {
        type: String,
        required: true
    },
    cover: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File Access Control',
        default: null
    }
},{ collection: 'ingredients', discriminatorKey: 'model' });

ingredientSchema.path('category').validate(async function(category) {
    const { sub_category } = this;
    const { isValid, reason } = await this.constructor.validateCategory(category, sub_category);
 
    if (!isValid && reason === 'invalid_category')
        return this.invalidate('category', 'Invalid category value', category, 'exist');
    else if (!isValid && reason === 'invalid_sub_categories')
        return this.invalidate('sub_category', 'Invalid sub-category value', this.sub_category, 'exist');

    return true;
});

ingredientSchema.virtual('verified').get(function() {
    return this instanceof VerifiedIngredient;
});

ingredientSchema.virtual('cover_url').get(function() {
    const { HOSTNAME, PORT, HTTP_PROTOCOL } = process.env;
    let filepath;
    if (this.cover) 
        filepath = 'assets/' + this.cover;
    else
        filepath = default_covers['ingredient'] ? 'assets/default/' + default_covers['ingredient'] : null;
    
    return filepath ? `${HTTP_PROTOCOL}://${HOSTNAME}:${PORT}/${filepath}` : null;
});

ingredientSchema.query.categoryFilter = function(filters) {
    const conditions = [];

    for (const category in filters) {
        const formatted = { category };
        const sub_category = filters[category];

        if (sub_category.length)
            formatted.sub_category = { $in: filters[category] };
        conditions.push(formatted);
    }
    
    return conditions.length ? this.where({ $or: conditions }) : this;
}

ingredientSchema.statics = {
    getCategories: async function() {
        const categories = await executeSqlQuery('SELECT name FROM ingredient_categories');
        return (await categories.map(item => item.name));
    },
    getSubCategories: async function(category) {
        const subCategories = await executeSqlQuery(`
            SELECT ingredient_sub_categories.name
            FROM ingredient_categories 
            JOIN ingredient_sub_categories ON ingredient_categories.id = ingredient_sub_categories.category_id 
            WHERE ingredient_categories.name = ?;
        `, [category]);
        return (await subCategories.map(item => item.name));
    },
    validateCategory: async function(category, subCategories = []) {
        if (typeof category !== 'string')
            throw new Error('Category must be a string value');
        else if (!Array.isArray(subCategories) && typeof subCategories === 'string')
            subCategories = [subCategories];
        else if (!Array.isArray(subCategories))
            throw new Error('Sub-Categories must be in an array');

        const [{ categoryId } = {}] = await executeSqlQuery(`
            SELECT id AS categoryId
            FROM ingredient_categories
            WHERE name = ? LIMIT 1;
        `, [category]);
        if (!categoryId)
            return { isValid: false, reason: 'invalid_category' };

        const validSubCategories = await executeSqlQuery(`
            SELECT name FROM 
            ingredient_sub_categories
            WHERE category_id = ? AND name IN (?)
        `, [categoryId, subCategories]);
        const invalidSubCategories = subCategories.filter(sub => {
            return !validSubCategories.find(row => row.name === sub);
        })
        if (invalidSubCategories.length)
            return { isValid: false, reason: 'invalid_sub_categories', errors: invalidSubCategories };

        return { isValid: true };
    }
}

const Ingredient = mongoose.model('Ingredient', ingredientSchema);

const verifiedSchema = new mongoose.Schema({
    date_verified: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    }
});

const VerifiedIngredient = Ingredient.discriminator('Verified Ingredient', verifiedSchema);

const userSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        immutable: true
    },
    public: {
        type: Boolean,
        default: false
    },
    date_created: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    }
});

const UserIngredient = Ingredient.discriminator('User Ingredient', userSchema);

module.exports = {
    Ingredient,
    VerifiedIngredient,
    UserIngredient
};
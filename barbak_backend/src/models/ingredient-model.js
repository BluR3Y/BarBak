const mongoose = require('mongoose');
const { executeSqlQuery } = require('../config/database-config');

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
    }
},{ collection: 'ingredients', discriminatorKey: 'model' });

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
    validateCategories: async function(category, subCategories) {
        let errors = {};
        let isValid = true;

        if (!Array.isArray(subCategories))
            subCategories = [subCategories];

        const [{ categoryCount }] = await executeSqlQuery(`
            SELECT COUNT(*) AS categoryCount
            FROM ingredient_categories
            WHERE name = ? LIMIT 1;
        `, [category]);
        if (!categoryCount) {
            errors['category'] = { type: 'valid', message: 'Invalid ingredient category' };
            isValid = false;
            return { isValid, errors };
        }

        for (const index in subCategories) {
            const [{ subCount }] = await executeSqlQuery(`
                SELECT COUNT(*) AS subCount
                FROM ingredient_categories
                JOIN ingredient_sub_categories ON ingredient_categories.id = ingredient_sub_categories.category_id
                WHERE ingredient_categories.name = ? AND ingredient_sub_categories.name = ? LIMIT 1;
            `, [category, subCategories[index]]);
            if (!subCount) {
                errors[index] = { type: 'valid', message: 'Invalid ingredient sub-category' };
                isValid = false;
            }
        }

        if (!isValid)
            errors = { sub_categories: errors };

        return { isValid, errors };
    }
}

ingredientSchema.methods.customValidate = async function() {
    const { category, sub_category } = this;
    const { isValid, errors } = await this.constructor.validateCategories(category, sub_category);

    if (!isValid) {
        const error = new Error();
        error.name = 'CustomValidationError';
        error.errors = errors['category'] ? errors : { sub_category: errors['sub_categories'][0] };
        throw error;
    }
}

const Ingredient = mongoose.model('Ingredient', ingredientSchema);

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
        default: false
    },
    date_created: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    }
});

module.exports = {
    Ingredient,
    VerifiedIngredient: Ingredient.discriminator('Verified Ingredient', verifiedSchema),
    UserIngredient: Ingredient.discriminator('User Ingredient', userSchema)
};
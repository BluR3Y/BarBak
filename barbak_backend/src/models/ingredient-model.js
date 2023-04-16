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
    classification: {
        type: {
            category: {
                type: Number,
                required: true
            },
            sub_category: {
                type: Number,
                required: true
            }
        },
        required: true,
        _id: false
    },
    cover: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File Access Control',
        default: null
    }
},{ collection: 'ingredients', discriminatorKey: 'model' });

ingredientSchema.path('classification').validate(async function({ category, sub_category }) {
    const { isValid, reason } = await this.constructor.validateCategory(category, sub_category);

    if (!isValid && reason === 'invalid_category')
        return this.invalidate('classification.category', 'Invalid category value', category, 'exist');
    else if (!isValid && reason === 'invalid_sub_categories')
        return this.invalidate('classification.sub_category', 'Invalid sub-category value', sub_category, 'exist');
    
    return true;
});

ingredientSchema.virtual('verified').get(function() {
    return this instanceof VerifiedIngredient;
});

ingredientSchema.virtual('classificationInfo').get(async function() {
    const { category, sub_category } = this.classification;
    const [{ categoryName, subName }] = await executeSqlQuery(`
        SELECT
            ingredient_categories.name AS categoryName,
            ingredient_sub_categories.name AS subName
        FROM ingredient_categories
        JOIN ingredient_sub_categories ON
        ingredient_categories.id = ingredient_sub_categories.category_id
        WHERE ingredient_categories.id = ? AND ingredient_sub_categories.id = ? LIMIT 1;    
    `, [category, sub_category]);

    return {
        category: {
            id: category,
            name: categoryName
        },
        sub_category: {
            id: sub_category,
            name: subName
        }
    };
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

ingredientSchema.query.categoryFilter = function(categories) {
    const conditions = categories.map(({ category, sub_categories }) => {
        return {
            'classification.category': category,
            ...(sub_categories ? {
                'classification.sub_category': { $in: sub_categories }
            } : {})
        }
    });
    return conditions.length ? this.where({ $or: conditions }) : this;
}

ingredientSchema.statics = {
    getCategories: async function() {
        const data = await executeSqlQuery(`
            SELECT
                ingredient_categories.id AS category_id,
                ingredient_categories.name AS category_name,
                JSON_ARRAYAGG(JSON_OBJECT(
                    'sub_category_id',ingredient_sub_categories.id,
                    'sub_category_name', ingredient_sub_categories.name
                )) AS sub_categories
            FROM ingredient_categories
            JOIN ingredient_sub_categories ON ingredient_categories.id = ingredient_sub_categories.category_id
            GROUP BY ingredient_categories.id
        `);
        const categories = data.map(item => {
            return {
                category_id: item.category_id,
                category_name: item.category_name,
                sub_categories: JSON.parse(item.sub_categories)
            };
        });
        return categories;
    },
    validateCategory: async function(category, subCategories = []) {
        if (!Array.isArray(subCategories))
            subCategories = [subCategories];

        const [{ categoryCount }] = await executeSqlQuery(`
            SELECT
                COUNT(*) AS categoryCount
            FROM ingredient_categories
            WHERE id = ? LIMIT 1;
        `, [category]);
        
        if (categoryCount && subCategories.length) {
            const ingredientSubCategories = await executeSqlQuery(`
                SELECT
                    id
                FROM ingredient_sub_categories
                WHERE category_id = ? AND id IN (?)
            `, [category, subCategories.length ? subCategories : 'NULL']);
            const invalidSubCategories = subCategories.filter(sub => {
                return !ingredientSubCategories.find(row => row.id === sub);
            });
            if (invalidSubCategories.length) {
                return {
                    isValid: false,
                    reason: 'invalid_sub_categories',
                    errors: invalidSubCategories
                }
            }
        } else if (!categoryCount) {
            return {
                isValid: false,
                reason: 'invalid_category'
            };
        }
        
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
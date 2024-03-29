const mongoose = require('mongoose');
const { executeSqlQuery } = require('../config/database-config');
const { default_covers } = require('../config/config.json');
const { getPreSignedURL } = require('../utils/aws-s3-operations');
const barwarePlugin = require('./plugins/barware');

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
        type: Number,
        required: true
    },
    sub_category: {
        type: Number,
        required: true
    },
    cover: {
        type: String,
        default: null
    },
    date_created: {
        type: Date,
        default: () => Date.now()
    }
},{ collection: 'ingredients', discriminatorKey: 'variant' });
ingredientSchema.plugin(barwarePlugin);

ingredientSchema.path('name').validate(async function(name) {
    return (!await this.constructor.exists({
        name,
        _id: { $ne: this._id },
        ...(!this.verified ? { user: this.user } : {})
    }));
}, 'Name is already associated with another ingredient');

ingredientSchema.path('category').validate(async function(category) {
    const { isValid, reason } = await this.constructor.validateCategory(category, this.sub_category);

    if (!isValid && reason === 'invalid_category')
        return this.invalidate('category', 'Invalid category value', category, 'exist');
    else if (!isValid && reason === 'invalid_sub_categories')
        return this.invalidate('sub_category', 'Invalid sub-category value', this.sub_category, 'exist');
    
    return true;
});

ingredientSchema.virtual('verified').get(function() {
    return (this instanceof this.model('Verified Ingredient'));
});

ingredientSchema.virtual('classification_info').get(async function() {
    const { category, sub_category } = this;
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

ingredientSchema.virtual('cover_url').get(async function() {
    return (await getPreSignedURL(this.cover || default_covers.ingredient));
});

ingredientSchema.pre('save', async function(next) {
    const { cover } = await this.constructor.findById(this._id) || {};
    const modifiedFields = this.modifiedPaths();

    if (modifiedFields.includes('cover') && cover)
        await s3FileRemoval({ filepath: cover });
    next();
});

ingredientSchema.pre('remove', async function(next) {
    if (this.cover)
        await s3FileRemoval({ filepath: this.cover });
    next();
});

ingredientSchema.statics.getCategories = async function() {
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
    return (await data.map(item => ({
        category_id: item.category_id,
        category_name: item.category_name,
        sub_categories: JSON.parse(item.sub_categories)
    })));
}

ingredientSchema.statics.validateCategory = async function(category, subCategories = []) {
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

ingredientSchema.statics.searchFilters = async function(categories) {
    const categoryValidations = await Promise.all(categories.map(({ category, sub_categories }) => this.validateCategory(category, sub_categories)));
    const invalidCategoryFilters = categoryValidations.reduce((accumulator, { isValid, reason, errors }, index) => ([
        ...accumulator,
        ...(!isValid ? [{
            category: categories[index].category,
            reason,
            ...(reason === 'invalid_sub_categories' ? {
                errors: errors.map(subId => ({
                    sub_category: subId,
                    message: 'Invalid sub-category value'
                }))
            } : {
                message: 'Invalid category value'
            })
        }] : [])
    ]), []);
    if (Object.keys(invalidCategoryFilters).length) {
        const error = new Error('Invalid categories provided');
        error.errors = invalidCategoryFilters;
        throw error;
    }
    return [
        ...(categories.map(({ category, sub_categories }) => ({
            'category': category,
            ...(sub_categories ? {
                'sub_category': { $in: sub_categories }
            } : {})
        })))
    ]
}

ingredientSchema.statics.__resourceType = function() {
    return 'ingredients';
}

const Ingredient = mongoose.model('Ingredient', ingredientSchema);

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
        default: false
    }
});

module.exports = {
    Ingredient,
    VerifiedIngredient: Ingredient.discriminator('Verified Ingredient', verifiedSchema),
    UserIngredient: Ingredient.discriminator('User Ingredient', userSchema)
};
const mongoose = require('mongoose');
const { executeSqlQuery } = require('../config/database-config');
const fileOperations = require('../utils/file-operations');

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

ingredientSchema.query.basicInfo = function() {
    return new Promise((resolve, reject) => {
        this.exec(function(err, documents) {
            if (err)
                return reject(err);
            resolve(documents.map(doc => doc.extendedStripExcess()));
        });
    });
}

ingredientSchema.query.extendedInfo = function() {
    return new Promise((resolve, reject) => {
        this.exec(function(err, documents) {
            if (err)
                return reject(err);
            resolve(documents.map(doc => doc.basicStripExcess()));
        });
    });
}

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
    formatCoverImage: function(filepath) {
        const { HOSTNAME, PORT } = process.env;
        if (!filepath) {
            const defaultCover = fileOperations.findByName('static/default', 'barware_cover');
            if (defaultCover.length)
                filepath = `assets/default/${defaultCover}`;
        }
        return filepath ? `http://${HOSTNAME}:${PORT}/${filepath}` : filepath;
    },
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
    validateCategories: async function(categories) {
        const errors = {};
        
        if (typeof categories !== 'object')
            categories = { [categories]: [] };

        for (const key in categories) {
            const [{ categoryCount }] = await executeSqlQuery(`
                SELECT COUNT(*) AS categoryCount
                FROM ingredient_categories
                WHERE name = ? LIMIT 1;
            `, [key]);
            if (!categoryCount) {
                errors[key] = { category: { type: 'valid', message: 'Invalid ingredient category' } };
                continue;
            }

            const values = Array.isArray(categories[key]) ? categories[key] : [categories[key]];
            await Promise.all(values.map(async subCategory => {
                const [{ subCount }] = await executeSqlQuery(`
                    SELECT COUNT(*) AS subCount
                    FROM ingredient_categories
                    JOIN ingredient_sub_categories ON ingredient_categories.id = ingredient_sub_categories.category_id
                    WHERE ingredient_categories.name = ? AND ingredient_sub_categories.name = ? LIMIT 1;
                `, [key, subCategory]);
                if (!subCount) {
                    if (!errors[key]?.['sub_categories'])
                        errors[key] = { sub_categories: {} };
                    errors[key].sub_categories[subCategory] = { type: 'valid', message: 'Invalid ingredient sub-category' };
                }
            }));
        }

        return { isValid: !Object.keys(errors).length, errors };
    }
}

ingredientSchema.methods.customValidate = async function() {
    const { category, sub_category } = this;
    const { isValid, errors } = await this.constructor.validateCategories({ [category]: sub_category });

    if (!isValid) {
        const error = new Error();
        error.name = 'CustomValidationError';
        error.errors = errors[category];
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

verifiedSchema.methods = {
    basicStripExcess: function() {
        return {
            _id: this._id,
            name: this.name,
            description: this.description,
            category: this.category,
            sub_category: this.sub_category,
            cover: this.constructor.formatCoverImage(this.cover),
            date_verified: this.date_verified
        };
    },
    extendedStripExcess: function() {
        return {
            _id: this._id,
            name: this.name,
            description: this.description,
            category: this.category,
            sub_category: this.sub_category,
            cover: this.constructor.formatCoverImage(this.cover),
        };
    }
}

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

userSchema.methods = {
    basicStripExcess: function() {
        return {
            _id: this._id,
            user: this.user,
            name: this.name,
            description: this.description,
            cover: this.constructor.formatCoverImage(this.cover_acl ? `assets/private/${this.cover_acl}` : null),
            date_created: this.date_created,
            public: this.public
        };
    },
    extendedStripExcess: function() {
        return {
            _id: this._id,
            user: this.user,
            name: this.name,
            description: this.description,
            cover: this.constructor.formatCoverImage(this.cover_acl ? `assets/private/${this.cover_acl}` : null)
        };
    }
}

module.exports = {
    Ingredient,
    VerifiedIngredient: Ingredient.discriminator('Verified Ingredient', verifiedSchema),
    UserIngredient: Ingredient.discriminator('User Ingredient', userSchema)
};
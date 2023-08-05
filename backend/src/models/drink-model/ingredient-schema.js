const mongoose = require('mongoose');
const { executeSqlQuery } = require('../../config/database-config');
const { Ingredient, UserIngredient } = require('../ingredient-model');

const ingredientSchema = new mongoose.Schema({
    ingredient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ingredient',
        required: true
    },
    measure: {
        type: {
            unit: {
                type: Number,
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 0.1,
                max: Number.MAX_SAFE_INTEGER,
                get: val => parseFloat(val).toFixed(2),
                set: val => parseFloat(val).toFixed(2)
            }
        },
        required: true,
        _id: false
    }
});

ingredientSchema.path('ingredient').validate(async function(ingredient) {
    const { ingredientInfo } = this;
    const baseDocument = this.ownerDocument();
    const { user, public } = baseDocument;
    const VerifiedDrink = baseDocument.model('Verified Drink');
    const UserDrink = baseDocument.model('User Drink');

    if (baseDocument instanceof VerifiedDrink && ingredientInfo instanceof UserIngredient) {
        return this.invalidate('ingredient', 'Verified drinks must contain verified ingredients', ingredient, 'valid');
    } else if (baseDocument instanceof UserDrink && ingredientInfo instanceof UserIngredient) {
        if (!ingredientInfo.user.equals(user)) {
            return this.invalidate('ingredient', 'Drink must contain ingredients that are verified or yours', ingredient, 'valid');
        } else if (public && !ingredientInfo.public) {
            return this.invalidate('ingredient', 'Public drinks must contain ingredients that are public', ingredient, 'valid');
        }
    }
    return true;
});

ingredientSchema.path('measure').validate(async function({ unit, quantity }) {
    const { category, sub_category } = this.ingredientInfo;
    const [data] = await executeSqlQuery(`
        SELECT
            measure.is_standardized,
            measure.measure_use,
            measure.ounce_equivalence
        FROM ingredient_categories
        JOIN ingredient_sub_categories
            ON ingredient_categories.id = ingredient_sub_categories.category_id
        JOIN measure
            ON ingredient_sub_categories.measure_state = 'all'
            OR (ingredient_sub_categories.measure_state = measure.measure_use
                OR measure.measure_use = 'miscellaneous'
            )
        WHERE ingredient_categories.id = ? AND ingredient_sub_categories.id = ? AND measure.id = ?
        LIMIT 1;
    `, [category, sub_category, unit]);

    if (!data) {
        return this.invalidate('measure.unit', 'Ingredient unit of measure is not valid', unit, 'valid');
    } else if (data && data.is_standardized) {
        this.measure = {
            unit: data.measure_use === 'volume' ? 2 : 1,
            quantity: quantity * data.ounce_equivalence
        };
    }
    return true;
});

// Created a 'Pre' middleware to get ingredient info
// and avoid repeating in each path validation
ingredientSchema.pre('validate', async function(next) {
    const ingredientInfo = await Ingredient.findOne({ _id: this.ingredient });
    if (!ingredientInfo) {
        this.invalidate('ingredient', 'Ingredient does not exist', this.ingredient, 'exist');
        this.$ignore('measure');
    } else {
        this.ingredientInfo = ingredientInfo;
    }
    next();
});

ingredientSchema.virtual('ingredient_info', {
    ref: 'Ingredient',
    localField: 'ingredient',
    foreignField: '_id'
});

ingredientSchema.virtual('measure_info').get(async function() {
    const { unit, quantity } = this.measure;
    const [{ id, singular_name, plural_name, abbriviation }] = await executeSqlQuery(`
        SELECT *
        FROM measure
        WHERE id = ?
        LIMIT 1;
    `, [unit]);
    return {
        unit: {
            id,
            singular_name,
            plural_name,
            abbriviation
        },
        quantity
    };
});

ingredientSchema.add({
    substitutes: {
        type: [ingredientSchema],
        _id: false
    },
    optional: {
        type: Boolean,
        default: false
    },
    garnish: {
        type: Boolean,
        default: false
    }
});

ingredientSchema.path('substitutes').validate(async function(substitutes) {
    if (substitutes.length > 5) {
        return this.invalidate('substitutes', 'Each ingredient is only permitted 5 substitutes', substitutes, 'valid');
    }
    const substituteIds = new Set(substitutes.map(item => item.ingredient.toString()));
    if (substituteIds.size !== substitutes.length) {
        return this.invalidate('substitutes', 'Each ingredient in a substitute list must be unique', substitutes, 'valid');
    } else if (substituteIds.has(this.ingredient.toString())) {
        return this.invalidate('substitutes', 'Ingredient can not be in substitutes list');
    }
    return true;
});

module.exports = ingredientSchema;
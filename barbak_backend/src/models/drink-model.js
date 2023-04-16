const mongoose = require('mongoose');
const { executeSqlQuery } = require('../config/database-config');
const { default_covers } = require('../config/config.json');

const { Ingredient, UserIngredient } = require('./ingredient-model');
const { Drinkware, UserDrinkware } = require('./drinkware-model');
const { Tool, UserTool } = require('./tool-model');

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
    },
    substitutes: {
        type: [{
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
            },
            _id: false
        }]
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

ingredientSchema.path('ingredient').validate(async function(ingredient) {
    const { ingredientInfo } = this;
    const parentDocument = this.$parent();
    const { user, public } = parentDocument;
    if (parentDocument instanceof VerifiedDrink && ingredientInfo instanceof UserIngredient)
        return this.invalidate('ingredient', 'Verified drinks must contain verified ingredients', ingredient, 'valid');
    else if (parentDocument instanceof UserDrink && ingredientInfo instanceof UserIngredient) {
        if (!ingredientInfo.user.equals(user))
            return this.invalidate('ingredient', 'Drink must contain ingredients that are verified or yours', ingredient, 'valid');
        else if (public && !ingredientInfo.public)
            return this.invalidate('ingredient', 'Public drinks must contain ingredients that are public', ingredient, 'valid');
    }
    return true;
});

ingredientSchema.path('measure').validate(async function({ unit, quantity }) {
    const { classification } = this.ingredientInfo;
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
    `, [classification.category, classification.sub_category, unit]);

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

ingredientSchema.path('substitutes').validate(async function(substitutes) {
    if (substitutes.length > 5)
        return this.invalidate('substitutes', 'Each ingredient is only permitted 5 substitutes', substitutes, 'valid');

    const substituteIds = new Set(substitutes.map(item => item.ingredient.toString()));
    if (substituteIds.size !== substitutes.length)
        return this.invalidate('substitutes', 'Each ingredient in a substitute list must be unique', substitutes, 'valid');
    else if (substituteIds.has(this.ingredient.toString()))
        return this.invalidate('substitutes', 'Ingredient can not be in substitutes list');

    const parentDocument = this.$parent();
    await Promise.all(substitutes.map(async ({ ingredient, measure }, subIndex) => {
        const subInfo = await Ingredient.findOne({ _id: ingredient });
        if (!subInfo)
            return this.invalidate(`substitutes.${subIndex}.ingredient`, 'Ingredient does not exist', ingredient, 'exist');
        
        if (parentDocument instanceof VerifiedDrink && subInfo instanceof UserIngredient)
            return this.invalidate(`substitutes.${subIndex}.ingredient`, 'Verified drinks must contain verified ingredients', ingredient, 'valid');
        else if (parentDocument instanceof UserDrink && subInfo instanceof UserIngredient) {
            if (!subInfo.user.equals(user))
                return this.invalidate(`substitutes.${subIndex}.ingredient`, 'Drink must contain ingredients that are verified or yours', ingredient, 'valid');
            else if (public && !subInfo.public)
                return this.invalidate(`substitutes.${subIndex}.ingredient`, 'Public drinks must contain ingredients that are public', ingredient, 'valid');
        }

        const { classification } = subInfo;
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
        `, [classification.category, classification.sub_category, measure.unit]);
    
        if (!data) {
            return this.invalidate(`substitutes.${subIndex}.measure.unit`, 'Ingredient unit of measure is not valid', unit, 'valid');
        } else if (data && data.is_standardized) {
            this.substitutes[subIndex].measure = {
                unit: data.measure_use === 'volume' ? 2 : 1,
                quantity: measure.quantity * data.ounce_equivalence
            }
        }
    }));

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

const drinkSchema = new mongoose.Schema({
    name: {
        type: String,
        minlength: 3,
        maxlength: 30,
        lowercase: true,
        required: true
    },
    description: {
        type: String,
        maxlength: 600,
    },
    preparation_method: {
        type: String,
        lowercase: true,
        required: true
    },
    serving_style: {
        type: String,
        lowercase: true,
        required: true
    },
    drinkware: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Drinkware',
        required: true
    },
    preparation: {
        type: [{
            type: String,
            minlength: 3,
            maxlength: 100
        }],
        validate: {
            validator: function(items) {
                return items && items.length <= 25;
            },
            message: 'Number of instructions cannot be greater than 25'
        }
    },
    ingredients: {
        type: [ingredientSchema],
        required: true
    },
    tools: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tool',
            required: true
        }],
        validate: {
            validator: function(items) {
                return items && items.length <= 15;
            },
            message: 'Number of tools cannot be greater than 15'
        }
    },
    tags: {
        type: [{
            type: String,
            minlength: 3,
            maxlength: 20
        }],
        validate: {
            validator: function(items) {
                return items && items.length <= 10;
            },
            message: 'Number of tags cannot be greater than 10'
        }
    },
    assets: {
        type: {
            gallery: {
                type: [{
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'File Access Control',
                    required: true
                }],
                validate: {
                    validator: function(items) {
                        return items && items.length <= 10;
                    },
                    message: 'Maximum of 10 images per drink'
                },
                default: Array,
            },
            _id: false
        },
        default: Object
    }
},{ collection: 'drinks', discriminatorKey: 'model' });

drinkSchema.path('preparation_method').validate(async function(method) {
    if (!await this.constructor.validatePreparationMethod(method))
        return this.invalidate('preparation_method', 'Invalid preparation method', method, 'exist');
    return true;
});

drinkSchema.path('serving_style').validate(async function(style) {
    if (!await this.constructor.validateServingStyle(style))
        return this.invalidate('serving_style', 'Invalid serving style', style, 'exist');
    return true;
});

drinkSchema.path('drinkware').validate(async function(drinkware) {
    const drinkwareInfo = await Drinkware.findOne({ _id: drinkware });
    if (!drinkwareInfo)
        return this.invalidate('drinkware', 'Drinkware does not exist', drinkware, 'exist');

    const { user, public } = this;
    if (this instanceof VerifiedDrink && drinkwareInfo instanceof UserDrinkware)
        return this.invalidate('drinkware', 'Verified drinks must contain verified drinkware', drinkware, 'valid');
    else if (this instanceof UserDrink && drinkwareInfo instanceof UserDrinkware) {
        if (!drinkwareInfo.user.equals(user))
            return this.invalidate('drinkware', 'Drink must contain a drinkware that is verified or your', drinkware, 'valid');
        else if (public && !drinkwareInfo.public)
            return this.invalidate('drinkware', 'Drinkware must be public to include in public drinks');
    }

    return true;
});

drinkSchema.path('ingredients').validate(function(items) {
    if (items.length < 2 || items.length > 25)
        return this.invalidate('ingredients', 'Drink must contains between 2 and 25 ingredients', items, 'invalid_argument');

    const ingredientIds = new Set(items.map(({ ingredient }) => ingredient.toString()));
    if (ingredientIds.size !== items.length)
        return this.invalidate('ingredients', 'Ingredient list must not contain multiple of the same ingredient', items, 'invalid_argument');

    return true;
});

drinkSchema.path('tools').validate(async function(tools) {
    const { user, public } = this;
    await Promise.all(tools.map(async (tool, index) => {
        const toolInfo = await Tool.findOne({ _id: tool });
        if (!toolInfo)
            return this.invalidate(`tools.${index}`, 'Tool does not exist', tool, 'exist');

        if (this instanceof VerifiedDrink && toolInfo instanceof UserTool)
            return this.invalidate(`tools.${index}`, 'Verified drinks must contain verified tools', tool, 'valid');
        else if (this instanceof UserDrink && toolInfo instanceof UserTool) {
            if (!toolInfo.user.equals(user))
                return this.invalidate(`tools.${index}`, 'Drink must contain tools that are verified or yours', tool, 'valid');
            else if (public && !toolInfo.public)
                return this.invalidate(`tools.${index}`, 'Tool must be public to include in public drinks');
        }
    }));
    return true;
});

drinkSchema.statics = {
    getPreparationMethods: async function() {
        const preparationMethods = await executeSqlQuery(`SELECT name FROM drink_preparation_methods`);
        return (await preparationMethods.map(item => item.name));
    },
    getServingStyles: async function() {
        const servingStyles = await executeSqlQuery(`SELECT name FROM drink_serving_styles`);
        return (await servingStyles.map(item => item.name));
    },
    validatePreparationMethod: async function(method) {
        const [{ methodCount }] = await executeSqlQuery(`
            SELECT COUNT(*) AS methodCount
            FROM drink_preparation_methods
            WHERE id = ? LIMIT 1;
        `, [method]);
        return !!methodCount;
    },
    validateServingStyle: async function(style) {
        const [{ styleCount }] = await executeSqlQuery(`
            SELECT COUNT(*) AS styleCount
            FROM drink_serving_styles
            WHERE id = ? LIMIT 1;
        `, [style]);
        return !!styleCount;
    }
}

// Drink virtuals

drinkSchema.virtual('verified').get(function() {
    return this instanceof VerifiedDrink;
});

drinkSchema.virtual('cover_url').get(function() {
    const { HOSTNAME, PORT, HTTP_PROTOCOL } = process.env;
    const { assets } = this;
    const basePath = `${HTTP_PROTOCOL}://${HOSTNAME}:${PORT}/`;

    if (assets?.gallery.length)
        return basePath + 'assets/' + assets.gallery[0];
    else if (typeof default_covers['drink'] !== 'undefined')
        return basePath + 'assets/default/' + default_covers['drink'];
    else
        return null;
});

drinkSchema.virtual('gallery_urls').get(function() {
    const { HOSTNAME, PORT, HTTP_PROTOCOL } = process.env;
    const { assets } = this;

    return assets.gallery.map(imagePath => `${HTTP_PROTOCOL}://${HOSTNAME}:${PORT}/assets/` + imagePath);
});

drinkSchema.virtual('drinkwareInfo', {
    ref: 'Drinkware',
    localField: 'drinkware',
    foreignField: '_id',
    justOne: true
});

drinkSchema.virtual('ingredientInfo', {
    ref: 'Ingredient',
    localField: 'ingredients.ingredient_id',
    foreignField: '_id'
});

drinkSchema.virtual('toolInfo', {
    ref: 'Tool',
    localField: 'tools',
    foreignField: '_id'
});

const Drink = mongoose.model('Drink', drinkSchema);

const verifiedSchema = new mongoose.Schema({
    date_verified: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    }
});

const VerifiedDrink = Drink.discriminator('Verified Drink', verifiedSchema);

const userSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        immutable: true,
        required: true,
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

const UserDrink = Drink.discriminator('User Drink', userSchema);

module.exports = {
    Drink,
    VerifiedDrink,
    UserDrink
};
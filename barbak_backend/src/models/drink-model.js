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
    }
});

ingredientSchema.path('ingredient').validate(async function(ingredient) {
    const { ingredientInfo } = this;
    const baseDocument = this.ownerDocument();
    const { user, public } = baseDocument;

    if (baseDocument instanceof VerifiedDrink && ingredientInfo instanceof UserIngredient)
        return this.invalidate('ingredient', 'Verified drinks must contain verified ingredients', ingredient, 'valid');
    else if (baseDocument instanceof UserDrink && ingredientInfo instanceof UserIngredient) {
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

const drinkIngredientSchema = ingredientSchema.add({
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

drinkIngredientSchema.path('substitutes').validate(async function(substitutes) {
    if (substitutes.length > 5)
        return this.invalidate('substitutes', 'Each ingredient is only permitted 5 substitutes', substitutes, 'valid');

    const substituteIds = new Set(substitutes.map(item => item.ingredient.toString()));
    if (substituteIds.size !== substitutes.length)
        return this.invalidate('substitutes', 'Each ingredient in a substitute list must be unique', substitutes, 'valid');
    else if (substituteIds.has(this.ingredient.toString()))
        return this.invalidate('substitutes', 'Ingredient can not be in substitutes list');

    return true;
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
        type: Number,
        required: true
    },
    serving_style: {
        type: Number,
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
        type: [drinkIngredientSchema],
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
        const preparationMethods = await executeSqlQuery(`SELECT * FROM drink_preparation_methods`);
        return (await preparationMethods.map(method => ({
            id: method.id,
            name: method.name
        })));
    },
    getServingStyles: async function() {
        const servingStyles = await executeSqlQuery(`SELECT * FROM drink_serving_styles`);
        return (await servingStyles.map(style => ({
            id: style.id,
            name: style.name
        })));
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
    },
    searchFilters: async function(preparation_methods, serving_styles) {
        const [preparationMethodValidations,servingStyleValidations] = await Promise.all([
            Promise.all(preparation_methods.map(method => Drink.validatePreparationMethod(method))),
            Promise.all(serving_styles.map(style => Drink.validateServingStyle(style)))
        ]);
        const invalidParameters = {
            ...(preparationMethodValidations.some(method => !method) ? {
                preparation_methods: preparation_methods.reduce((accumulator, current, index) => ([
                    ...accumulator,
                    ...(!preparationMethodValidations[index] ? [{
                        preparation_method: current,
                        message: 'Invalid preparation method'    
                    }] : []) 
                ]), [])
            } : {}),
            ...(servingStyleValidations.some(style => !style) ? {
                serving_styles: serving_styles.reduce((accumulator, current, index) => ([
                    ...accumulator,
                    ...(!servingStyleValidations[index] ? [{
                        serving_style: current,
                        message: 'Invalid serving style'
                    }] : [])
                ]), [])
            } : {})
        };
        if (Object.keys(invalidParameters).length) {
            const error = new Error('Invalid filter parameters');
            error.errors = invalidParameters;
            throw error;
        }
        return [
            ...(preparation_methods.length ? [{ preparation_method: { $in: preparation_methods } }] : []),
            ...(serving_styles.length ? [{ serving_style: { $in: serving_styles } }] : [])
        ];
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

drinkSchema.virtual('drinkware_info', {
    ref: 'Drinkware',
    localField: 'drinkware',
    foreignField: '_id',
    justOne: true
});

drinkSchema.virtual('tool_info', {
    ref: 'Tool',
    localField: 'tools',
    foreignField: '_id'
});

drinkSchema.virtual('preparation_method_info').get(async function() {
    const [{ id, name }] = await executeSqlQuery(`
        SELECT
            id,
            name
        FROM drink_preparation_methods
        WHERE id = ?
        LIMIT 1;
    `, [this.preparation_method]);
    return { id, name };
});

drinkSchema.virtual('serving_style_info').get(async function() {
    const [{ id, name }] = await executeSqlQuery(`
        SELECT
            id,
            name
        FROM drink_serving_styles
        WHERE id = ?
        LIMIT 1;
    `, [this.serving_style]);
    return { id, name };
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
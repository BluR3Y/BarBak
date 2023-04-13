const mongoose = require('mongoose');
const { executeSqlQuery } = require('../../config/database-config');
const { default_covers } = require('../../config/config.json');

const verifiedDrinkSchema = require('./verified-drink-schema');
const userDrinkSchema = require('./user-drink-schema');
const { Ingredient, UserIngredient } = require('../ingredient-model');

const ingredientSchema = new mongoose.Schema({
    ingredient_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ingredient',
        required: true
    },
    measure: {
        type: {
            unit: {
                type: String,
                lowercase: true,
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
            ingredient_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Ingredient',
                required: true
            },
            measure: {
                type: {
                    unit: {
                        type: String,
                        lowercase: true,
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
        }],
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

ingredientSchema.path('ingredient_id').validate(async function(ingredient) {
    const ingredientInfo = await Ingredient.findOne({ _id: ingredient });
    if (!ingredientInfo)
        return this.invalidate('ingredient_id', 'Ingredient does not exist', ingredient, 'exist');

    const parentDocument = this.$parent();
    const { user, public } = parentDocument;

    if (parentDocument instanceof VerifiedDrink && ingredientInfo instanceof UserIngredient)
        return this.invalidate('ingredient_id', 'User ingredients can not be used on verified drinks', ingredient, 'valid');
    else if (parentDocument instanceof UserDrink && public && !(ingredientInfo.user.equals(user) && ingredientInfo.public))
        return this.invalidate('ingredient_id', 'Public drink ingredients must be verified or ones you created that are public', ingredient, 'valid');
    else if (parentDocument instanceof UserDrink && !public && !ingredientInfo.user.equals(user))
        return this.invalidate('ingredient_id', 'Drink ingredients must be verified or ones you created', ingredient, 'valid');

    return true;
});

ingredientSchema.path('measure').validate(async function(measure) {
    const ingredientInfo = await Ingredient.findOne({ _id: this.ingredient_id });
    const [data] = await executeSqlQuery(`
        SELECT measure.is_standardized, measure.measure_use ,measure.ounce_equivalence, measure.name
        FROM ingredient_categories
        JOIN ingredient_sub_categories ON ingredient_categories.id = ingredient_sub_categories.category_id
        JOIN measure ON ingredient_sub_categories.measure_state = 'all' OR (ingredient_sub_categories.measure_state = measure.measure_use OR measure.measure_use = 'miscellaneous')
        WHERE ingredient_categories.name = ? AND ingredient_sub_categories.name = ? AND measure.name = ? LIMIT 1;
    `, [ingredientInfo.category, ingredientInfo.sub_category, measure.unit]);

    if (!data) {
        return this.invalidate('measure', 'Ingredient unit of measure is not valid', measure, 'valid');
    } else if (data && data.is_standardized) {
        this.measure = {
            unit: data.measure_use === 'volume' ? 'fluid ounce' : 'ounce',
            quantity: measure.quantity * data.ounce_equivalence
        };
    }

    return true;
});

ingredientSchema.path('substitutes').validate(async function(substitutes) {
    if (substitutes.length > 5)
        return this.invalidate('substitutes', 'Each ingredient is only permitted 5 substitutes', substitutes, 'valid');

    const substituteNames = new Set(substitutes.map(item => item.ingredient_id.toString()));
    if (substituteNames.size !== substitutes.length)
        return this.invalidate('substitutes', 'Each ingredient in a substitute list must be unique', substitutes, 'valid');
    else if (substituteNames.has(this.ingredient_id.toString()))
        return this.invalidate('substitutes', 'Ingredient can not be in substitutes list');

    // Last Here

    return true;
});

// ingredientSchema.pre('validate', async function(next) {
//     this.tester = 'lolz';
//     next();
// });

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
        type: [ingredientSchema]
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
    const { isValid, reason } = await this.validateDrinkware(drinkware);
    if (!isValid)
        return this.invalidate('drinkware', reason === 'exist' ? 'Drinkware does not exist' : 'Invalid drinkware', drinkware, reason);
    return true;
});

drinkSchema.path('ingredients').validate(function(items) {
    const uniqueNames = new Set(items.map(ingredient => ingredient.ingredient_id.toString()))
    if (uniqueNames.size !== items.length)
        return this.invalidate('ingredients', 'Ingredient list must not contain multiple of the same ingredient', items, 'invalid_argument');

    if (items.length < 2 || items.length > 25)
        return this.invalidate('ingredients', 'Drink must contains between 2 and 25 ingredients', items, 'invalid_argument');
    return true;
})

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
            WHERE name = ? LIMIT 1;
        `, [method]);
        return !!methodCount;
    },
    validateServingStyle: async function(style) {
        const [{ styleCount }] = await executeSqlQuery(`
            SELECT COUNT(*) AS styleCount
            FROM drink_serving_styles
            WHERE name = ? LIMIT 1;
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
const VerifiedDrink = Drink.discriminator('Verified Drink', verifiedDrinkSchema);
const UserDrink = Drink.discriminator('User Drink', userDrinkSchema);

module.exports = {
    Drink,
    VerifiedDrink,
    UserDrink
};
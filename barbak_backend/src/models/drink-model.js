const mongoose = require('mongoose');
const { executeSqlQuery } = require('../config/database-config');
const { Drinkware } = require('./drinkware-model');
const { Ingredient } = require('./ingredient-model');

const ingredientSchema = {
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
                    max: Number.MAX_SAFE_INTEGER
                }
            },
            required: true
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
                            max: Number.MAX_SAFE_INTEGER
                        }
                    },
                    required: true
                }
            }],
            validate: {
                validator: function(items) {
                    return items && items.length <= 5;
                },
                message: 'Each ingredient is only permitted 5 substitutes'
            }
        },
        optional: {
            type: Boolean,
            default: false
        },
        garnish: {
            type: Boolean,
            default: false
        }
    }],
    validate: {
        validator: function(items) {
            return items && items.length >= 2 && items.length <= 25;
        },
        message: 'Drink must contain between 2 and 25 ingredients'
    }
}

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
    ingredients: ingredientSchema,
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
    }
},{ collection: 'drinks', discriminatorKey: 'model' });

drinkSchema.statics = {
    getPreparationMethods: async function() {
        const preparationMethods = await executeSqlQuery(`SELECT name FROM drink_preparation_methods`);
        return (await preparationMethods.map(item => item.name));
    },
    getServingStyles: async function() {
        const servingStyles = await executeSqlQuery(`SELECT name FROM drink_serving_styles`);
        return (await servingStyles.map(item => item.name));
    },
    validatePreparationMethods: async function(methods) {
        const errors = {};

        if (!Array.isArray(methods))
            methods = [methods];

        await Promise.all(methods.map(async method => {
            const [{ methodCount }] = await executeSqlQuery('SELECT COUNT(*) AS methodCount FROM drink_preparation_methods WHERE name = ? LIMIT 1;', [method]);
            if (!methodCount) {
                errors[method] = { type: 'valid', message: 'Invalid drink preparation method' };
            }
        }));

        return { isValid: !Object.keys(errors).length, errors };
    },
    validateServingStyles: async function(styles) {
        const errors = {};

        if (!Array.isArray(styles))
            styles = [styles];

        await Promise.all(styles.map(async style => {
            const [{ styleCount }] = await executeSqlQuery('SELECT COUNT(*) AS styleCount FROM drink_serving_styles WHERE name = ? LIMIT 1;', [style]);
            if (!styleCount) {
                errors[style] = { type: 'valid', message: 'Invalid drink serving style' };
            }
        }));

        return { isValid: !Object.keys(errors).length, errors };
    },
    validateDrinkware: async function(drinkware, publicUse, user) {
        const errors = {};

        if (!Array.isArray(drinkware))
            drinkware = [drinkware];

        await Promise.all(drinkware.map(async container => {
            const drinkwareInfo = await Drinkware.findOne({ _id: container });

            if (!drinkwareInfo) {
                errors[container] = { type: 'exist', message: 'Drinkware does not exist' };
                return;
            } else if (
                (publicUse && (drinkwareInfo.model !== 'Verified Drinkware' && !(drinkwareInfo.user.equals(user) && drinkwareInfo.public))) ||      // Private User Drink
                (!publicUse && (drinkwareInfo.mode !== 'Verified Drinkware' && !drinkwareInfo.user.equals(user)))       // Public User Drink
            )
                errors[container] = { type: 'valid', message: 'Unauthorized to use drinkware' };
        }));
        return { isValid: !Object.keys(errors).length, errors };
    },
    validateIngredients: async function(ingredients) {
        const errors = {};

        if (!Array.isArray(ingredients))
            ingredients = [ingredients];

        await Promise.all(ingredients.map(async (ingredientObj, index) => {
            const ingredientErrors = {};
            const ingredientInfo = await Ingredient.findOne({ _id: ingredientObj.ingredient_id });

            if (ingredientInfo) {
                const [data] = await executeSqlQuery(`
                    SELECT measure.is_standardized, measure.measure_use ,measure.ounce_equivalence, measure.name
                    FROM ingredient_categories
                    JOIN ingredient_sub_categories ON ingredient_categories.id = ingredient_sub_categories.category_id
                    JOIN measure ON ingredient_sub_categories.measure_state = 'all' OR (ingredient_sub_categories.measure_state = measure.measure_use OR measure.measure_use = 'miscellaneous')
                    WHERE ingredient_categories.name = ? AND ingredient_sub_categories.name = ? AND measure.name = ? LIMIT 1;
                `, [ingredientInfo.category, ingredientInfo.sub_category, ingredientObj.measure.unit]);

                if (!data) {
                    ingredientErrors.measure = { type: 'valid', message: 'Invalid ingredient measure unit' };
                } else if (data && data.is_standardized) {
                    ingredientObj.measure = {
                        unit: data.measure_use === 'volume' ? 'fluid ounce' : 'ounce',
                        quantity: ingredientObj.measure.quantity * data.ounce_equivalence
                    }
                }
                console.log(data, ingredientObj.measure.unit)
            } else
                ingredientErrors.ingredient_id = { type: 'exist', message: 'Ingredient does not exist' };

            await Promise.all(ingredientObj.substitutes.map(async (substituteObj, subIndex) => {
                const substituteErrors = {};
                const substituteInfo = await Ingredient.findOne({ _id: substituteObj.ingredient_id });
                
                if (substituteInfo) {
                    const [subData] = await executeSqlQuery(`
                        SELECT measure.is_standardized, measure.measure_use ,measure.ounce_equivalence
                        FROM ingredient_categories
                        JOIN ingredient_sub_categories ON ingredient_categories.id = ingredient_sub_categories.category_id
                        JOIN measure ON ingredient_sub_categories.measure_state = 'all' OR (ingredient_sub_categories.measure_state = measure.measure_use OR measure.measure_use = 'miscellaneous')
                        WHERE ingredient_categories.name = ? AND ingredient_sub_categories.name = ? AND measure.name = ? LIMIT 1;
                    `, [substituteInfo.category, substituteInfo.sub_category, substituteObj.measure.unit]);

                    if (!subData) {
                        substituteErrors.measure = { type: 'valid', message: 'Invalid ingredient measure unit' };
                    } else if (subData && subData.is_standardized) {
                        substituteObj.measure = {
                            unit: subData.measure_use === 'volume' ? 'fluid ounce' : 'ounce',
                            quantity: substituteObj.measure.quantity * subData.ounce_equivalence
                        }
                    }
                } else
                    substituteErrors.ingredient_id = { type: 'exist', messge: 'Ingredient substitute does not exist' };
                
                if (Object.keys(substituteErrors).length) {
                    if (!ingredientErrors.substitutes)
                        ingredientErrors.substitutes = {};
                    ingredientErrors.substitutes[subIndex] = substituteErrors;
                }
            }));

            if (Object.keys(ingredientErrors).length)
                errors[index] = ingredientErrors;
        }));
        
        return { isValid: !Object.keys(errors).length, errors };
    }
}

const Drink = mongoose.model('Drink', drinkSchema);

const verifiedSchema = new mongoose.Schema({
    assets: {
        type: {
            cover: {
                type: String,
                default: null
            },
            gallery: {
                type: [String],
                validate: {
                    validator: function(items) {
                        return items && items.length <= 10;
                    },
                    message: 'Cannot exceed limit of 10 images'
                },
                default: null
            }
        }
    },
    date_verified: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    }
});

const userSchema = new mongoose.Schema({
    assets: {
        type: {
            cover_acl: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'App Access Control',
                default: null
            },
            gallery_acl: {
                type: [{
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'App Access Control',
                }],
                validate: {
                    validator: function(items) {
                        return items && items.length <= 10;
                    },
                    message: 'Cannot exceed limit of 10 images'
                },
                default: null
            }
        }
    },
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

// User Drink can use both private(own) and public ingredients/drinkware/tools etc.
userSchema.methods.customValidate = async function() {
    const error = new Error();
    error.name = 'CustomValidationError';
    error.errors = {};

    const { preparation_method, serving_style, drinkware, ingredients, tools } = this;
    const preparationMethodValidation = await this.constructor.validatePreparationMethods(preparation_method);
    const servingStyleValidation = await this.constructor.validateServingStyles(serving_style);
    const drinkwareValidation = await this.constructor.validateDrinkware(drinkware, false, this.user);
    const ingredientValidtion = await this.constructor.validateIngredients(ingredients);

    if (!preparationMethodValidation.isValid)
        error.errors['preparation_method'] = preparationMethodValidation.errors[preparation_method];
    if (!servingStyleValidation.isValid)
        error.errors['serving_style'] = servingStyleValidation.errors[serving_style];
    if (!drinkwareValidation.isValid)
        error.errors['drinkware'] = drinkwareValidation.errors[drinkware];
    if (!ingredientValidtion.isValid)
        error.errors['ingredients'] = ingredientValidtion.errors;


    if (Object.keys(error.errors).length)
        throw error;
}

module.exports = {
    Drink,
    VerifiedDrink: Drink.discriminator('Verified Drink', verifiedSchema),
    UserDrink: Drink.discriminator('User Drink', userSchema)
};
const mongoose = require('mongoose');
const { executeSqlQuery } = require('../config/database-config');
const { Drinkware } = require('./drinkware-model');

const ingredientSchema = {
    type: [{
        referenced_document: {
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
                referenced_document: {
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
    // const drinkwareValidation = await this.constructor.validateDrinkware(drinkware);

    if (!preparationMethodValidation.isValid)
        error.errors['preparation_method'] = preparationMethodValidation.errors[preparation_method];
    if (!servingStyleValidation.isValid)
        error.errors['serving_style'] = servingStyleValidation.errors[serving_style];

    if (!await Drinkware.exists(drinkware))
        error.errors['drinkware'] = { type: 'exist', message: 'Drinkware does not exist' };
    else if (!await Drinkware.useAuthorized(drinkware, this.user, false))
        error.errors['drinkware'] = { type: 'valid', message: 'Unauthorized use of drinkware' };

    // Stopped Here


    if (Object.keys(error.errors).length)
        throw error;
}

module.exports = {
    Drink,
    VerifiedDrink: Drink.discriminator('Verified Drink', verifiedSchema),
    UserDrink: Drink.discriminator('User Drink', userSchema)
};
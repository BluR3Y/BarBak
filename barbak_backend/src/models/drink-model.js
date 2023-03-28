const mongoose = require('mongoose');
const { executeSqlQuery } = require('../config/database-config');

const ingredientSchema = {
    type: [{
        ingredient_document: {
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
                ingredient_document: {
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
    validatePreparationMethod: async function(method) {
        const { methodCount } = await executeSqlQuery('SELECT COUNT(*) AS methodCount FROM drink_preparation_methods WHERE name = ? LIMIT 1;', [method]).then(res => res[0]);
        return !!methodCount;
    },
    validateServingStyle: async function(style) {
        const { styleCount } = await executeSqlQuery('SELECT COUNT(*) AS styleCount FROM drink_serving_styles WHERE name = ? LIMIT 1;', [style]).then(res => res[0]);
        return !!styleCount;
    }
}

const Drink = mongoose.model('Drink', drinkSchema);

Drink.validateServingStyle('neat')
.then(res => console.log(res));

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

module.exports = {
    Drink,
    VerifiedDrink: Drink.discriminator('Verified Drink', verifiedSchema),
    UserDrink: Drink.discriminator('User Drink', userSchema)
};
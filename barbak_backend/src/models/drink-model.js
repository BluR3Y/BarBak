const mongoose = require('mongoose');
const { executeSqlQuery } = require('../config/database-config');

const ingredientSchema = {
    type: [{
        ingredient_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Ingredient',
            required: [true, 'Ingredient identifier is required']
        },
        measure: {
            type: {
                unit: {
                    type: String,
                    required: [true, 'Unit of measure is required'],
                    lowercase: true
                },
                quantity: {
                    type: Number,
                    required: [true, 'Quantity of measure is required'],
                    min: [1, 'Quantity value is less than permitted amount'],
                    max: [Number.MAX_SAFE_INTEGER, 'Quantity value is greater than permitted amount'],
                }
            },
            required: [true, 'Ingredient Measure is required']
        },
        substitutes: {
            type: [{
                ingredient_id: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Ingredient',
                    required: [true, 'Substitute identifier is required']
                },
                measure: {
                    type: {
                        unit: {
                            type: String,
                            lowercase: true,
                            required: [true, 'Substitute Unit of measure is required']
                        },
                        quantity: {
                            type: Number,
                            required: [true, 'Substitute Quanitity is required'],
                            min: [1, 'Quantity value is less than permitted amount'],
                            max: [Number.MAX_SAFE_INTEGER, 'Quantity value is greater than permitted amount']
                        }
                    },
                    required: [true, 'Substitute Measure is required']
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
        minLength: [3, 'Name must be at least 3 characters long'],
        maxLength: [30, 'Name length must not exceed 30 characters'],
        required: [true, 'Name is required'],
        lowercase: true
    },
    description: {
        type: String,
        maxLength: [600, 'Description length must not exceed 600 characters']
    },
    preparation_method: {
        type: String,
        required: [true, 'Preparation Method is required'],
        lowercase: true
    },
    serving_style: {
        type: String,
        required: [true, 'Serving Style is required'],
        lowercase: true
    },
    drinkware: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Drinkware',
        required: [true, 'Drinkware identifier is required']
    },
    preparation: {
        type: [{
            type: String,
            minLength: [3, 'Instruction must be at least 3 characters long'],
            maxLength: [100, 'Instruction length must not exceed 100 characters']
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
            required: [true, 'Tool identifier is required']
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
            minLength: [3, 'Tag must be at least 3 characters long'],
            maxLength: [20, 'Tag length must not exceed 20 characters']
        }],
        validate: {
            validator: function(items) {
                return items && items.length <= 10;
            },
            message: 'Number of tags cannot be greater than 10'
        }
    },
    images: {
        type: [String],
        validate: {
            validator: function(items) {
                return items && items.length <= 10;
            }
        }
    }
},{ collection: 'drinks', discriminatorKey: 'model' });

const Drink = mongoose.model("Drink", drinkSchema);

const publicDrinkSchema = new mongoose.Schema({
    date_published: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    }
});

const privateDrinkSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date_created: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    }
});

module.exports = {
    PublicDrink: Drink.discriminator("Public Drink", publicDrinkSchema),
    PrivateDrink: Drink.discriminator("Private Drink", privateDrinkSchema)
};
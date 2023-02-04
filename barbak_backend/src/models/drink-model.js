const mongoose = require('mongoose');
const { executeSqlQuery } = require('../config/database-config');
const Drinkware = require('./drinkware-model');
const Tool = require('./tool-model');
const Ingredient = require('./ingredient-model');

const ingredientSchema = {
    type: [{
        ingredientId: {
            type: mongoose.SchemaTypes.ObjectId,
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
                    min: 0,
                    max: Number.MAX_SAFE_INTEGER
                }
            },
            required: true
        },
        optional: {
            type: Boolean,
            default: false
        },
        garnish: {
            type: Boolean,
            default: false
        },
        substitutes: {
            type: [{
                ingredientId: {
                    type: mongoose.SchemaTypes.ObjectId,
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
                            min: 0,
                            max: Number.MAX_SAFE_INTEGER
                        }
                    },
                    required: true
                }
            }]
        }
    }],
    validate: function(items) {
        return items.length >= 2 && items.length <= 25;
    }
}

const validatePreparationMethod = async function(method) {
    const res = await executeSqlQuery(`SELECT method_id FROM drink_preparation_methods WHERE name = '${method}';`);
    return res.length > 0;
}

const validateServingStyle = async function(style) {
    const res = await executeSqlQuery(`SELECT style_id FROM drink_serving_styles WHERE name = '${style}';`);
    return res.length > 0;
}

const drinkSchema = new mongoose.Schema({
    name: {
        type: String,
        minLength: 3,
        maxLength: 30,
        lowercase: true,
        required: true,
    },
    description: {
        type: String,
        maxLength: 500,
    },
    preparation_method: {
        type: String,
        lowercase: true,
        required: true,
        validate: validatePreparationMethod
    },
    serving_style: {
        type: String,
        lowercase: true,
        required: true,
        validate: validateServingStyle
    },
    drinkware: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Drinkware',
        required: true
                // validate drinkware exists and is allowed to be used
    },
    preparation: {
        type: [{
            type: String,
            minLength: 3,
            maxLength: 80,
        }],
        validate: function(items) {
            return items.length <= 25;
        }
    },
    ingredients: ingredientSchema,
    tools: {
        type: [{
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Tool',
            required: true
        }],
        validate: function(items) {
            return items.length <= 15;
        }
    },
    tags: {
        type: [{
            type: String,
            minLength: 3,
            maxLength: 20
        }],
        trim: true,
        max: 10
    },
    images: {
        type: [String],
    },
    user: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true,
        immutable: true
    },
    visibility: {
        type: String,
        lowercase: true,
        required: true,
        default: 'private',
        enum: {
            values: ['private', 'public', 'in-review'],
            message: props => `${props.value} is not a valid 'visibility' state`,
        }
    },
    creation_date: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    }
}, { collection: 'drinks' });

drinkSchema.statics.getPreparationMethods = async function() {
    const methods = await executeSqlQuery(`SELECT name FROM drink_preparation_methods`);
    return (await methods.map(item => item.name));
}

drinkSchema.statics.getServingStyles = async function() {
    const styles = await executeSqlQuery(`SELECT name FROM drink_serving_styles`);
    return (await styles.map(item => item.name));
}

drinkSchema.statics.getMeasures = async function(type, category) {
    const {type_id} = await executeSqlQuery(`SELECT type_id FROM ingredient_types WHERE name = '${type}';`)
        .then(res => res[0]);

    const {measure_state} = await executeSqlQuery(`SELECT measure_state FROM ingredient_categories WHERE type_id = ${type_id} AND name = '${category}';`)
        .then(res => res[0]);

    const allowedUnits = await executeSqlQuery(`SELECT name FROM measure WHERE measure_use = '${measure_state}';`);
    return allowedUnits.map(item => item.name);
}

drinkSchema.methods.validateDrinkware = async function() {
    const error = new Error();
    error.name = "CustomValidationError";
    error.errors = {};
    
    const drinkware = await Drinkware.findOne({ _id: this.drinkware });
    if (!drinkware) {
        error.errors.drinkware = "exist";
        throw error;
    }
    else if (drinkware.visibility !== 'public' && !drinkware.user.equals(this.user._id)) {
        error.errors.drinkware = "valid";
        throw error;
    } 
}

drinkSchema.methods.validateTools = async function() {
    const error = new Error();
    error.name = "CustomValidationError";
    error.errors = {};

    for (const index in this.tools) {
        const toolInfo = await Tool.findOne({ _id: this.tools[index] });
        if (!toolInfo) {
            error.errors[`tools.${index}`] = "exist";
            continue;
        }
        if (toolInfo.visibility !== 'public' && !toolInfo.user.equals(this.user._id)) {
            error.errors[`tools.${index}`] = "valid";
            continue;
        }
    }
    if (Object.keys(error.errors).length > 0)
        throw error;
}

drinkSchema.methods.validateIngredients = async function() {
    const error = new Error();
    error.name = "CustomValidationError";
    error.errors = {};

    for (const index in this.ingredients) {
        const ingredientInfo = await Ingredient.findOne({ _id: this.ingredients[index].ingredientId });
        if (!ingredientInfo) {
            error.errors[`ingredients.${index}`] = "exist";
            continue;
        }
        else if (ingredientInfo.visibility !== 'public' && !ingredientInfo.user.equals(this.user._id)) {
            error.errors[`ingredients.${index}`] = "valid";
            continue;
        }

        const {type_id} = await executeSqlQuery(`SELECT type_id FROM ingredient_types WHERE name = '${ingredientInfo.type}';`)
            .then(res => res[0]);

        const {measure_state} = await executeSqlQuery(`SELECT measure_state FROM ingredient_categories WHERE type_id = ${type_id} AND name = '${ingredientInfo.category}';`)
            .then(res => res[0]);

        const measure_id = await executeSqlQuery(`SELECT measure_id FROM measure WHERE measure_use = '${measure_state}' AND name = '${this.ingredients[index].measure.unit}';`);

        if (measure_id.length === 0) {
            error.errors[`ingredients.${index}`] = "measure invalid";
            continue;
        }
    }
    if (Object.keys(error.errors).length > 0)
        throw error;
}

module.exports = mongoose.model('Drink', drinkSchema);
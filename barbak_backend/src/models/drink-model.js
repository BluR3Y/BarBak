const mongoose = require('mongoose');
const { executeSqlQuery } = require('../config/database-config');
const { BaseTool } = require('../models/tool-model');
const { BaseIngredient } = require('../models/ingredient-model');
const { BaseDrinkware } = require('../models/drinkware-model');
const FileOperations = require('../utils/file-operations');

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
            },
            message: 'Maximum of 10 images can be attached to a drink'
        },
        default: null
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
        const { methodCount } = await executeSqlQuery(`SELECT count(*) AS methodCount FROM drink_preparation_methods WHERE name = '${method}' LIMIT 1;`)
            .then(res => res[0]);
        return Boolean(methodCount);
    },
    validateServingStyle: async function(style) {
        const { styleCount } = await executeSqlQuery(`SELECT count(*) AS styleCount FROM drink_serving_styles WHERE name = '${style}' LIMIT 1;`)
            .then(res => res[0]);
        return Boolean(styleCount);
    }
}

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

privateDrinkSchema.query.userExposure = function() {
    return this.select('name description preparation_method serving_style images date_created -model')
}

privateDrinkSchema.statics.makePublic = async function(snapshot) {
    const { name, description, preparation_method, serving_style, drinkware, preparation, ingredients, tools, tags, images } = snapshot;
    const copiedImages = images ? await FileOperations.copyMultiple(images, 'assets/public/images/') : null;
    const createdDocument = this.model('Public Drink')({
        name,
        description,
        preparation_method,
        serving_style,
        drinkware,
        preparation,
        ingredients,
        tools,
        tags,
        images: copiedImages
    });
    await createdDocument.save();
}

privateDrinkSchema.methods.customValidate = async function() {
    const { name, description, preparation_method, serving_style, drinkware, preparation, ingredients, tools, tags } = this;
    const error = new Error();
    error.name = "CustomValidationError";
    error.errors = {};
    
    const { methodCount } = await executeSqlQuery(`SELECT count(*) AS methodCount FROM drink_preparation_methods WHERE name = '${preparation_method}' LIMIT 1;`)
        .then(res => res[0]);
    if (!methodCount)
        error.errors['preparation_method'] = { type: 'valid', message: 'Invalid Preparation Method' };
    
    const { styleCount } = await executeSqlQuery(`SELECT count(*) AS styleCount FROM drink_serving_styles WHERE name = '${serving_style}' LIMIT 1;`)
        .then(res => res[0]);
    if (!styleCount)
        error.errors['serving_style'] = { type: 'valid', message: 'Invalid Serving Style' };

    const drinkwareDocument = await BaseDrinkware.findOne({ _id: drinkware, $or: [ { model: 'Public Drinkware' }, { model: 'Private Drinkware', user_id: this.user_id } ] });
    if (!drinkwareDocument)
        error.errors['drinkware'] = { type: 'valid', message: 'Invalid Drinkware' };

    const toolErrors = {};
    for (const toolIndex in tools) {
        const toolErr = {};
        if (! await BaseTool.exists({ _id: tools[toolIndex], $or: [ { model: 'Public Tool' }, { model: 'Private Tool', user_id: this.user_id } ] }))
            toolErrors[toolIndex] = { type: 'exist', message: 'Tool does not exist' };
        if (Object.keys(toolErr).length)
            toolErrors[toolIndex] = toolErr;
    }
    if (Object.keys(toolErrors).length)
        error.errors['tools'] = toolErrors;

    const ingredientErrors = {};
    for (const ingredientIndex in ingredients) {
        let ingredientErr = {};
        const { ingredient_id, measure, substitutes } = ingredients[ingredientIndex];
        const ingredientDocument = await BaseIngredient.findOne({ _id: ingredient_id, $or: [{ model: 'Public Ingredient' },{ model: 'Private Ingredient', user_id: this.user_id }] });
        if (ingredientDocument) {
            let { name, description, type, category } = ingredientDocument;
            const { ingredientTypeId } = await executeSqlQuery(`SELECT type_id AS ingredientTypeId FROM ingredient_types WHERE name = '${type}';`)
                .then(res => res[0]);
            const { ingredientMeasureState } = await executeSqlQuery(`SELECT measure_state AS ingredientMeasureState FROM ingredient_categories WHERE type_id = ${ingredientTypeId} AND name = '${category}';`)
                .then(res => res[0]);
            const { measureCount } = await executeSqlQuery(`SELECT count(*) AS measureCount FROM measure WHERE measure_use = '${ingredientMeasureState}' AND name = '${measure.unit}' LIMIT 1;`)
                .then(res => res[0]);
            if (measureCount) {
                const substituteErrors = {};
                for (const substituteIndex in substitutes) {
                    const substituteErr = {};
                    const substituteDocument = await BaseIngredient.findOne({ _id: substitutes[substituteIndex].ingredient_id, $or: [{ model: 'Public Ingredient' },{ model: 'Private Ingredient', user_id: this.user_id }] });
                    if (substituteDocument) {
                        const { substituteTypeId } = await executeSqlQuery(`SELECT type_id AS substituteTypeId FROM ingredient_types WHERE name = '${substituteDocument.type}';`)
                        .then(res => res[0]);
                        const { substituteMeasureState } = await executeSqlQuery(`SELECT measure_state AS substituteMeasureState FROM ingredient_categories WHERE type_id = ${substituteTypeId} AND name = '${substituteDocument.category}';`)
                        .then(res => res[0]);
                        const { substituteMeasureCount } = await executeSqlQuery(`SELECT count(*) AS substituteMeasureCount FROM measure WHERE measure_use = '${substituteMeasureState}' AND name = '${substitutes[substituteIndex].measure.unit}' LIMIT 1;`)
                        .then(res => res[0]);
                        if (!substituteMeasureCount)
                            substituteErr['measure'] = { type: 'valid', message: 'Invalid ingredient measure Unit' };
                    }else
                        substituteErr['ingredient_id'] = { type: 'exist', message: 'Substitute ingredient does not exist' };
                    
                    if (Object.keys(substituteErr).length)
                        substituteErrors[substituteIndex] = substituteErr;
                }
                if (Object.keys(substituteErrors).length)
                    ingredientErr['substitutes'] = substituteErrors;
            }else
                ingredientErr['measure'] = { type: 'valid', message: 'Invalid ingredient measure unit' };
        } else
            ingredientErr['ingredient_id'] = { type: 'exist', message: 'Ingredient does not exist' };

        if (Object.keys(ingredientErr).length)
            ingredientErrors[ingredientIndex] = ingredientErr;
    }
    if (Object.keys(ingredientErrors).length)
        error.errors['ingredients'] = ingredientErrors;

    if (Object.keys(error.errors).length)
        throw error;
}

module.exports = {
    PublicDrink: Drink.discriminator("Public Drink", publicDrinkSchema),
    PrivateDrink: Drink.discriminator("Private Drink", privateDrinkSchema),
    BaseDrink: Drink
};
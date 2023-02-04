const mongoose = require('mongoose');
const { executeSqlQuery } = require('../config/database-config');
const Drinkware = require('./drinkware-model');
const Tool = require('./tool-model');
const Ingredient = require('./ingredient-model');


const validatePreparationMethod = async (method) => {
    const res = await executeSqlQuery(`SELECT method_id FROM drink_preparation_methods WHERE name = '${method}';`);
    return res.length > 0;
}

const validateServingStyle = async (style) => {
    const res = await executeSqlQuery(`SELECT style_id FROM drink_serving_styles WHERE name = '${style}';`);
    return res.length > 0;
}

const validateTool = async function(tool) {
    const res = await Tool.findOne({ _id: tool });
    if (!res) return false;
    if (res.visibility !== 'public')
        return res.user.equals(this.user._id)

    return true;
}

const validateIngredient = async function(ingredientId) {
    const ingredientInfo = await Ingredient.findOne({ _id: ingredientId });
    if (!ingredientInfo) return false;
    if (ingredientInfo.visibility !== 'public') 
        return ingredientInfo.user.equals(this.user._id);
    return true;
}

const validateMeasure = async function(measure) {
    const ingredientItem = await Ingredient.findOne({ _id: this.ingredientId });
    const ingredientType = await executeSqlQuery(`SELECT type_id FROM ingredient_types WHERE name = '${ingredientItem.type}';`)
        .then(res => res[0].type_id);
    const ingredientMeasureState = await executeSqlQuery(`SELECT measure_state FROM ingredient_categories WHERE type_id = ${ingredientType} AND name = '${ingredientItem.category}';`)
        .then(res => res[0].measure_state);
    const measure_id = await executeSqlQuery(`SELECT measure_id FROM measure WHERE measure_use = '${ingredientMeasureState}' AND name = '${measure.unit}';`);
    return measure_id.length > 0;
}

const ingredientObjectSchema = {
    ingredientId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Ingredient',
        required: true,
        validate: validateIngredient
    },
    measure: {
        type: {
            unit: {
                type: String,
                lowercase: true,
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
                min: 0,
                max: Number.MAX_SAFE_INTEGER
            }
        },
        required: true,
        validate: validateMeasure
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
                required: true,
            },
            measure: {
                type: {
                    unit: {
                        type: String,
                        lowercase: true,
                        required: true,
                    },
                    quantity: {
                        type: Number,
                        required: true,
                        min: 0,
                        max: Number.MAX_SAFE_INTEGER,
                    }
                },
                required: true,
            }
        }]
    },
};

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
        required: true,
        validate: async function(drinkware) {
            const res = await Drinkware.findOne({ _id: drinkware });
            return res !== null;
        }
    },
    preparation: {
        type: [String],
        validate: function(items) {
            return items.length <= 20;
        }
    },
    ingredients: {
        type: [ingredientObjectSchema],
        validate: function(items) {
            return items.length >= 2 && items.length <= 25;
        }
    },
    tools: {
        type: [{
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Tool',
            required: true,
            validate: validateTool
        }],
        validate: {
            validator: function(items) {
                return items.length <= 15;
            }
        }
    },
    tags: {
        type: [String],
        trim: true,
        validate: {
            validator: function(items) {
                return items.length <= 10;
            }
        }
    },
    images: {
        type: [String]
    },
    user: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "User",
        required: true,
        immutable: true,
    },
    visibility: {
        type: String,
        required: true,
        lowercase: true,
        default: 'private',
        enum: {
            values: ['private', 'public', 'in-review'],
            message: props => `${props.value} is not a valid 'visibility' state`,
        }
    },
    creation_date: {
        type: Date,
        immutable: true,
        default: () => Date.now(),
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


// const testDrink = new Drink({ 
//     name: 'espresso martini',
//     description: 'drink info here',
//     preparation_method: 'stir',
//     serving_style: 'straight-up',
//     drinkware: '63cc5ab8ac6f54c022e836ab',
//     ingredients: [
//         {
//             ingredientId: '63cc5ab8ac6f54c022e836ab',
//             measure: {
//                 unit: 'ml',
//                 quantity: 100
//             },
//             substitutes: [
//                 {
//                     ingredientId: '63cc5ab8ac6f54c022e836ab',
//                     measure: {
//                         unit: 'ml',
//                         quantity: 200,
//                     }
//                 },{
//                     ingredientId: '63cc5ab8ac6f54c022e836ab',
//                     measure: {
//                         unit: 'oz',
//                         quantity: 100
//                     }
//                 }
//             ],
//             optional: false,
//             garnish: false,
//         },
//         {
//             ingredientId: '63cc5ab8ac6f54c022e836ab',
//             measure: {
//                 unit: 'ml',
//                 quantity: 100
//             },
//             substitutes: [
//                 {
//                     ingredientId: '63cc5ab8ac6f54c022e836ab',
//                     measure: {
//                         unit: 'ml',
//                         quantity: 200,
//                     }
//                 },{
//                     ingredientId: '63cc5ab8ac6f54c022e836ab',
//                     measure: {
//                         unit: 'oz',
//                         quantity: 100
//                     }
//                 }
//             ],
//             optional: false,
//             garnish: false,
//         }
//     ],
//     tools: [ "63cc5ab8ac6f54c022e836ab", '63cc5ab8ac6f54c022e836ab', '63cc5ab8ac6f54c022e836ab' ],
//     preparation: [ "first", "second", "third" ],
//     tags: [ "sweet", "strong", "summer", "refreshing" ]
// });
// testDrink.save()

module.exports = mongoose.model("Drink", drinkSchema);
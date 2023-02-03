const mongoose = require('mongoose');
const { executeSqlQuery } = require('../config/database-config');

const drinkPreparationMethods = [ "stir", "shake", "blend" , "build", "muddle", "layer", "flame", "churn", "carbonate", "infuse", "smoke", "spherify", "swizzle", "roll", "other" ];

const drinkServingStyles = [ "neat", "straight-up", "on-the-rocks", "straight", "chilled" ];

const ingredientMeasurementUnits = [ "ml", "oz", "shot", "piece" ];

const ingredientObjectSchema = {
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
                enum: ingredientMeasurementUnits
            },
            quantity: {
                type: Number,
                required: true,
                min: 0,
                max: Number.MAX_SAFE_INTEGER
            }
        },
        required: true,
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
                        enum: ingredientMeasurementUnits,
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
        enum: drinkPreparationMethods
    },
    serving_style: {
        type: String,
        lowercase: true,
        required: true,
        enum: drinkServingStyles,
    },
    drinkware: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Drinkware',
        required: true,
    },
    preparation: {
        type: [String],
        validate: {
            validator: function(items) {
                return items.length <= 20;
            }
        }
    },
    ingredients: {
        type: [ingredientObjectSchema],
        validate: {
            validator: function(items) {
                return items.length >= 2 && items.length <= 25;
            }
        }
    },
    tools: {
        type: [{
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Tool',
            required: true,
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
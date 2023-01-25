const mongoose = require('mongoose');
const _ = require('lodash');

// Base Ingredient Schema
// const ingredientSchema = new mongoose.Schema({
//     name: {
//         type: String,
//         minLength: 3,
//         maxLength: 30,
//         lowercase: true,
//         required: true,
//     },
//     description: {
//         type: String,
//         maxLength: 500,
//     },
//     category: {
//         type: String,
//         required: true,
//         lowercase: true,
//         enum: {
//             values: ['alcohol', 'beverage', 'juice', 'fruit', 'other'],
//             message: props => `${props.value} is not a valid 'category' state`
//         }
//     },
//     user: {
//         type: mongoose.SchemaTypes.ObjectId,
//         required: true,
//         immutable: true,
//     },
//     visibility: {
//         type: String,
//         required: true,
//         lowercase: true,
//         enum: {
//             values: ['private', 'public', 'in-review'],
//             message: props => `${props.value} is not a valid 'visibility' state`,
//         }
//     },
//     creation_date: {
//         type: Date,
//         immutable: true,
//         default: () => Date.now(),
//     }
// }, { collection: 'ingredients' });


// // Derived Alcohol Schema
// const alcoholicIngredientSchema = new mongoose.Schema({
//     alcohol_category: {
//         type: String,
//         lowercase: true,
//         required: true,
//         enum: {
//             values: ['beer', 'wine', 'liquor', 'liqueur', 'other'],
//             message: props => `${props.value} is not a valid 'alcohol_category' state`,
//         }
//     },
//     alcohol_by_volume: {
//         type: Array,
//         validate: {
//             validator: val => {
//                 if(val.length > 2)
//                     return false;
//                 var prev = -1;
//                 for(var i = 0; i < val.length; i++) {
//                     if(isNaN(val[i]) || val[i] > 100 || val[i] < 0 || prev > val[i])
//                         return false;
//                     prev = val[i];
//                 }
//                 return true;
//             },
//             message: 'provided value is invalid',
//         }
//     }
// }, { collection: 'ingredients' });

// const Ingredient = mongoose.model("ingredient", ingredientSchema);
// const AlcoholicIngredient = Ingredient.discriminator('alcoholic-ingredient', alcoholicIngredientSchema);

// module.exports = { Ingredient, AlcoholicIngredient }

const typeCategories = {
    liquor: [ "whiskey", "gin", "vodka", "rum", "tequila", "brandy" ],
    liqueur: [ "orange", "coffee", "cream", "nut", "herb", "fruit" ],
    beer: [ "lager", "ale", "wheat", "stout", "porter", "sour", "belgia" ],
    wine: [ "red", "white", "rose", "sparkling", "fortified" ],
    mixer: [ "juice", "syrup", "soda", "dairy", "bitter", "spice", "herbs" ],
    fruit: [ "citrus", "berries", "melons", "tropical", "stone", "pome" ],
    other: [ "alcoholic", "non-alcoholic" ]
};

const ingredientSchema = new mongoose.Schema({
    name: {
        type: String,
        minLength: 3,
        maxLength: 30,
        required: true,
    },
    description: {
        type: String,
        maxLength: 500
    },
    type: {
        type: String,
        required: true,
        validate: {
            validator: val => _.includes(Object.keys(typeCategories), val)
        }
    },
    category: {
        type: String,
        required: true,
        validate: {
            validator: function(val) {
                return _.includes(typeCategories[this.type], val);
            }
        }
    },
    user: {
        type: mongoose.SchemaTypes.ObjectId,
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
}, { collection: 'ingredients' });

const alcoholicIngredientSchema = new mongoose.Schema({
    alcohol_by_volume: {
        type: Array,
        validate: {
            validator: val => {
                if(val.length > 2)
                    return false;
                var prev = -1;
                for(var i = 0; i < val.length; i++) {
                    if(isNaN(val[i]) || val[i] > 100 || val[i] < 0 || prev > val[i])
                        return false;
                    prev = val[i];
                }
                return true;
            },
            message: "provided value for 'alcohol_by_volume' is invalid",
        }
    }
}, { collection: 'ingredients' });

const Ingredient = mongoose.model("ingredient", ingredientSchema);
const AlcoholicIngredient = Ingredient.discriminator('alcoholic-ingredient', alcoholicIngredientSchema);

module.exports = { Ingredient, AlcoholicIngredient }
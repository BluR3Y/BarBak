const mongoose = require('mongoose');

// Base Ingredient Schema
const ingredientSchema = new mongoose.Schema({
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
    category: {
        type: String,
        required: true,
        lowercase: true,
        enum: {
            values: ['alcohol', 'beverage', 'juice', 'fruit', 'other'],
            message: props => `${props.value} is not a valid 'category' state`
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


// Derived Alcohol Schema
const alcoholicIngredientSchema = new mongoose.Schema({
    alcohol_category: {
        type: String,
        lowercase: true,
        required: true,
        enum: {
            values: ['beer', 'wine', 'liquor', 'liqueur', 'other'],
            message: props => `${props.value} is not a valid 'alcohol_category' state`,
        }
    },
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
            message: 'provided value is invalid',
        }
    }
}, { collection: 'ingredients' });

const Ingredient = mongoose.model("ingredient", ingredientSchema);
const AlcoholicIngredient = Ingredient.discriminator('alcoholic-ingredient', alcoholicIngredientSchema);

module.exports = { Ingredient, AlcoholicIngredient }
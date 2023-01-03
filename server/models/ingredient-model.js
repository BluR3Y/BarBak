const mongoose = require('mongoose');
const ingredientValidators = require('../validators/ingredient-validators');

// Base Ingredient Schema
const ingredientSchema = new mongoose.Schema({
    name: {
        type: String,
        maxLength: 30,
        lowercase: true,
        required: true,
    },
    description: {
        type: String,
        maxLength: 280,
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

ingredientSchema.statics.validate = function(data) {
    return ingredientValidators.createIngredientSchema.validate(data);
}


// Derived Alcohol Schema
const alcoholicIngredientSchema = new mongoose.Schema({
    alcohol_category: {
        type: String,
        lowercase: true,
        required: true,
        enum: {
            values: ['beer', 'wine', 'liquor', 'liqueur'],
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
                    if(isNaN(val[i]) || val[i] > 100 || val[i] < 0 || prev >= val[i])
                        return false;
                    prev = val[i];
                }
                return true;
            },
            message: 'provided value is invalid',
        }
    }
}, { collection: 'ingredients' });

alcoholicIngredientSchema.statics.validate = function(data) {
    return ingredientValidators.createAlcoholicIngredientSchema.validate(data);
}

const Ingredient = mongoose.model("ingredient", ingredientSchema);
const AlcoholicIngredient = Ingredient.discriminator('alcoholic-ingredient', alcoholicIngredientSchema);

module.exports = { Ingredient, AlcoholicIngredient }
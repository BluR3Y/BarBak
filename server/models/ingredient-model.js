const mongoose = require('mongoose');

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
        validate: {
            validator: val => (
                val === 'alcohol' || 
                val === 'beverage' ||
                val === 'juice' ||
                val === 'fruit' ||
                val === 'other'
            ),
            message: props => `${props.value} is not a valid category`,
        },
    },
    user: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true,
        immutable: true,
    },
    visibility: {
        type: String,
        default: 'private',
        validate: {
            validator: val => (val === 'private' || val === 'public' || val === 'in-review'),
            message: props => `${props.value} is not a valid state`,
        },
    },
    creation_date: {
        type: Date,
        immutable: true,
        default: () => Date.now(),
    }
}, { collection: 'ingredients' });

ingredientSchema.methods.tester = function() {
    console.log('tester');
}

// module.exports = mongoose.model("ingredients", ingredientSchema);

const Ingredient = mongoose.model("ingredients", ingredientSchema);
const AlcoholIngredient = Ingredient.discriminator('alcohol', new mongoose.Schema({
    alcohol_category: {
        type: String,
        validate: {
            validator: val => (
                val === 'beer' ||
                val === 'wine' ||
                val === 'liquor' ||
                val === 'liqueur'
            ),
            message: props => `${props.value} is not a valid category`,
        },
    },
    alcohol_by_volume: {
        type:  Array,
        validate: {
            validator: val => {
                if (val.length > 2)
                    return false;
                for(var i = 0; i < val.length; i++) {
                    if(val[i] > 100)
                        return false;
                }
            },
            message: props => 'provided value is invalid',
        },
    }
}));

module.exports = { Ingredient, AlcoholIngredient };
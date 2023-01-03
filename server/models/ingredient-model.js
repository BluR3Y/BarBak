const mongoose = require('mongoose');
const Joi = require('joi');

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

const ingredient_validation_schema = Joi.object({
    name: Joi.string()
        .max(30)
        .lowercase()
        .required(),
    description: Joi.string()
        .max(280),
    category: Joi.string()
        .lowercase()
        .valid('alcohol', 'beaverage', 'juice', 'fruit', 'other')
        .required(),
});

ingredientSchema.statics.validate = function(data) {
    return ingredient_validation_schema.validate(data);
}


// Derived Alcohol Schema
const alcoholSchema = new mongoose.Schema({
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

const alcohol_validation_schema = Joi.object({
    alcohol_category: Joi.string()
        .lowercase()
        .valid('beer', 'wine', 'liquor', 'liqueur')
        .required(),
    alcohol_by_volume: Joi.array()
        .max(2)
        .items(Joi.number())
})

alcoholSchema.statics.validate = function(data) {
    return ingredient_validation_schema.concat(alcohol_validation_schema).validate(data);
}

const Ingredient = mongoose.model("ingredients", ingredientSchema);
const AlcoholIngredient = Ingredient.discriminator('alcohol', alcoholSchema);

module.exports = { Ingredient, AlcoholIngredient }
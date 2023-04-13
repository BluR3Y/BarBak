const mongoose = require('mongoose');
const { Drinkware, UserDrinkware } = require('../drinkware-model');
const { Ingredient, UserIngredient } = require('../ingredient-model');

const userDrinkSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        immutable: true,
        required: true,
    },
    public: {
        type: Boolean,
        default: false
    },
    date_created: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    }
});

userDrinkSchema.methods = {
    validateDrinkware: async function(drinkware) {
        const drinkwareInfo = await Drinkware.findOne({ _id: drinkware });

        if (!drinkwareInfo)
            return { isValid: false, reason: 'exist' };
        else if (drinkwareInfo instanceof UserDrinkware && (this.public ?
            !(drinkwareInfo.user.equals(this.user) && drinkwareInfo.public) :
            !drinkwareInfo.user.equals(this.user)
        ))
            return { isValid: false, reason: 'valid' };
        
        return { isValid: true };
    },
    validateIngredient: async function(ingredient) {
        const ingredientInfo = await Ingredient.findOne({ _id: ingredient.ingredient_id });

        if (!ingredientInfo)
            return { isValid: false, reason: 'exist' };
        else if (ingredientInfo instanceof UserIngredient && (this.public ?
            !(ingredientInfo.user.equals(this.user) && ingredientInfo.public) :
            !ingredientInfo.user.equals(this.user)
        ))
            return { isValid: false, reason: 'valid' };

        return { isValid: true };
    }
}

module.exports = userDrinkSchema;
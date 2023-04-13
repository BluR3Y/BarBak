const mongoose = require('mongoose');
const { Drinkware, VerifiedDrinkware } = require('../drinkware-model');
const { Ingredient } = require('../ingredient-model');

const verifiedDrinkSchema = new mongoose.Schema({
    date_verified: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    }
});

verifiedDrinkSchema.methods = {
    validateDrinkware: async function(drinkware) {
        const drinkwareInfo = await Drinkware.findOne({ _id: drinkware });

        if (!drinkwareInfo)
            return { isValid: false, reason: 'exist' };
        else if (!(drinkwareInfo instanceof VerifiedDrinkware))
            return { isValid: false, reason: 'valid' };
        return { isValid: true };
    },
    validateIngredient: async function(ingredient) {
        const ingredientInfo = await Ingredient.findOne({ _id: ingredient });

        if (!ingredientInfo)
            return { isValid: false, reason: 'exist' };
        else if (!(ingredientInfo instanceof VerifiedDrinkware))
            return { isValid: false, reason: 'invalid' };

        return { isValid: true };
    }
}

module.exports = verifiedDrinkSchema;
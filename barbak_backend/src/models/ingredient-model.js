const mongoose = require('mongoose');
const { executeSqlQuery } = require('../config/database-config');

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
    },
    category: {
        type: String,
        required: true,
    },
    image: {
        type: String
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
}, { collection: 'ingredients' });

ingredientSchema.statics.validateInfo = async function(type, given_category) {
    const category = await executeSqlQuery(` SELECT category_id FROM categorical_data WHERE category_group = "ingredients" AND category = "ingredient_types" `);
    const category_item = await executeSqlQuery(` SELECT category_item_id FROM categorical_data_item WHERE category_id = ${category[0].category_id} AND data = "${type}" `);
    if (category_item.length === 0)
        return { path: 'type', type: 'valid' };
    else if(given_category === 'other')
        return true;
    const sub_category_item = await executeSqlQuery(` SELECT categorical_sub_item_id FROM categorical_sub_data_item WHERE category_item_id = ${category_item[0].category_item_id} AND data = "${given_category}" `);
    if (sub_category_item.length === 0)
        return { path: 'category', type: 'valid' };

    return true;
}

module.exports = mongoose.model("Ingredient", ingredientSchema);
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

ingredientSchema.statics.getIngredientTypes = async function() {
    const types = await executeSqlQuery(`SELECT name FROM ingredient_types`);
    return (await types.map(type => type.name));
}

ingredientSchema.statics.getIngredientCategories = async function(type) {
    const {type_id} = await executeSqlQuery(`SELECT type_id FROM ingredient_types WHERE name = '${type}';`)
        .then(res => res[0]);

    if (!type_id) return Array();
        
    const categories = await executeSqlQuery(`SELECT name FROM ingredient_categories WHERE type_id = ${type_id}`);
    return (await categories.map(item => item.name));
}

ingredientSchema.statics.validateInfo = async function(type, category) {
    const {type_id} = await executeSqlQuery(`SELECT type_id FROM ingredient_types WHERE name = '${type}';`)
        .then(res => res.length ? res[0] : res);
    if (!type_id) return Array();
    const {category_id} = await executeSqlQuery(`SELECT category_id FROM ingredient_categories WHERE type_id = ${type_id} AND name = '${category}';`)
        .then(res => res.length ? res[0] : 0);
    return category_id !== undefined;
}

module.exports = mongoose.model("Ingredient", ingredientSchema);
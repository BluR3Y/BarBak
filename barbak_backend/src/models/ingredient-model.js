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
        default: 'private', 
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

ingredientSchema.statics.getTypes = async function() {
    const types = await executeSqlQuery(`SELECT name FROM ingredient_types`);
    return (await types.map(type => type.name));
}

ingredientSchema.statics.getCategories = async function(type) {
    const {type_id} = await executeSqlQuery(`SELECT type_id FROM ingredient_types WHERE name = '${type}';`)
        .then(res => res[0]);

    if (!type_id) return Array();
        
    const categories = await executeSqlQuery(`SELECT name FROM ingredient_categories WHERE type_id = ${type_id}`);
    return (await categories.map(item => item.name));
}

ingredientSchema.methods.customValidate = async function() {
    const error = new Error();
    error.name = "CustomValidationError";
    error.errors = [];

    if (await this.model('Ingredient').findOne({ name: this.name }))
        error.errors['name'] = "exist";
    
    const {type_id} = await executeSqlQuery(`SELECT type_id FROM ingredient_types WHERE name = '${this.type}';`)
        .then(res => res.length ? res[0] : res);
    if (!type_id)
        error.errors['type'] = "valid";

    if (!error.errors['type']) {
        const {category_id} = await executeSqlQuery(`SELECT category_id FROM ingredient_categories WHERE type_id = ${type_id} AND name = '${this.category}';`)
            .then(res => res.length ? res[0] : res);
        if (!category_id)
            error.errors['category'] = "valid";
    }

    if(Object.keys(error.errors).length)
        throw error;
}

module.exports = mongoose.model("Ingredient", ingredientSchema);
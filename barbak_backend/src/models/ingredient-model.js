const mongoose = require('mongoose');
const { executeSqlQuery } = require('../config/database-config');
const FileOperations = require('../utils/file-operations');

const Ingredient = mongoose.model("Ingredient", new mongoose.Schema({
    name: {
        type: String,
        minLength: [3, 'Name must be at least 3 characters long'],
        maxLength: [30, 'Name length must not exceed 30 characters'],
        required: [true, 'Name is required']
    },
    description: {
        type: String,
        maxLength: [600, 'Description must not exceed 600 characters']
    },
    type: {
        type: String,
        required: [true, 'Ingredient type is required'],
    },
    category: {
        type: String,
        required: [true, 'Ingredient category is required']
    },
    image: {
        type: String,
        default: null
    }
},{ collection: 'ingredients', discriminatorKey: 'model' }));

Ingredient.schema.statics = {
    getTypes: async function() {
        const types = await executeSqlQuery(`SELECT name FROM ingredient_types`);
        return (await types.map(item => item.name));
    },
    getCategories: async function(type) {
        const { type_id } = await executeSqlQuery(`SELECT type_id FROM ingredient_types WHERE name = '${type}';`)
            .then(res => res.length ? res[0] : res);
        
        if (!type_id)
            return;
        const categories = await executeSqlQuery(`SELECT name FROM ingredient_categories WHERE type_id = ${type_id};`);
        return (await categories.map(item => item.name));
    }
}

const publicIngredientSchema = new mongoose.Schema({
    date_published: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    }
});

const privateIngredientSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        immutable: true
    },
    date_created: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    }
});

privateIngredientSchema.statics.makePublic = async function(snapshot) {
    const { name, description, type, category, image } = snapshot;
    const copiedImage = image ? await FileOperations.copySingle(image, 'assets/public/images/') : null;
    const createdDocument = this.model('Public Ingredient')({
        name,
        description,
        type,
        category,
        image: copiedImage
    });
    await createdDocument.save();
}

privateIngredientSchema.methods.customValidate = async function() {
    const { type, category } = this;
    const error = new Error();
    error.name = "CustomValidationError";
    error.errors = {};

    const { typeCount } = await executeSqlQuery(`SELECT count(*) AS typeCount FROM ingredient_types WHERE name = '${type}' LIMIT 1;`)
        .then(res => res[0]);
    if (typeCount) {
        const { categoryCount } = await executeSqlQuery(`SELECT count(*) AS categoryCount FROM ingredient_categories WHERE name = '${category}' LIMIT 1;`)
            .then(res => res[0]);
        if (!categoryCount)
            error.errors['category'] = { type: 'valid', message: 'Invalid ingredient category' };
    }else
        error.errors['type'] = { type: 'valid', message: 'Invalid ingredient type' };
    
    if (Object.keys(error.errors).length)
        throw error;
}

module.exports = {
    PublicIngredient: Ingredient.discriminator("Public Ingredient", publicIngredientSchema),
    PrivateIngredient: Ingredient.discriminator("Private Ingredient", privateIngredientSchema),
    BaseIngredient: Ingredient
};


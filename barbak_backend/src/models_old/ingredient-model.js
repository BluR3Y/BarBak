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
        const { type_id } = await executeSqlQuery('SELECT type_id FROM ingredient_types WHERE name = ? LIMIT 1;', [type])
            .then(res => res.length ? res[0] : res);

        if (type_id) {
            const categories = await executeSqlQuery('SELECT name FROM ingredient_categories WHERE type_id = ?;', [type_id]);
            return (await categories.map(item => item.name));
        } else throw new Error('Invalid ingredient type');
    },
    validateTypeCategory: async function(type, category) {
        const errors = {};
        const { type_id } = await executeSqlQuery('SELECT type_id FROM ingredient_types WHERE name = ? LIMIT 1;', [type])
            .then(res => res.length ? res[0] : res);
        
        if (type_id) {
            const { categoryCount } = await executeSqlQuery('SELECT COUNT(*) AS categoryCount FROM ingredient_categories WHERE type_id = ? AND name = ? LIMIT 1;', [type_id, category])
                .then(res => res[0]);
            if (!categoryCount)
                errors['category'] = { type: 'valid', message: 'Invalid ingredient category' };
        } else errors['type'] = { type: 'valid', message: 'Invalid ingredient type' };

        return errors;
    }
}

Ingredient.schema.query.typeCategoryFilter = function(args) {
    if (args.length) {
        return this.or(args);
    } else return this;
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

privateIngredientSchema.query.userExposure = function() {
    return this.select('name description type category image date_created -model');
}

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

    const typeCategoryErrors = await this.constructor.validateTypeCategory(type, category);
    for (const err in typeCategoryErrors) {
        error.errors[err] = typeCategoryErrors[err];
    }
    
    if (Object.keys(error.errors).length)
        throw error;
}

module.exports = {
    PublicIngredient: Ingredient.discriminator("Public Ingredient", publicIngredientSchema),
    PrivateIngredient: Ingredient.discriminator("Private Ingredient", privateIngredientSchema),
    BaseIngredient: Ingredient
};


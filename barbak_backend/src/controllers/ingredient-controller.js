const { PublicIngredient, PrivateIngredient } = require('../models/ingredient-model');
const FileOperations = require('../utils/file-operations');

module.exports.create = async (req, res) => {
    try {
        const { name, description, type, category } = req.body;

        if (await PrivateIngredient.exists({ user_id: req.user._id, name }))
            return res.status(400).send({ path: 'name', type: 'exist', message: 'A tool with that name currently exists' });

        const createdIngredient = new PrivateIngredient({
            name, 
            description,
            type,
            category,
            user_id: req.user._id
        });
        await createdIngredient.validate();
        await createdIngredient.customValidate();
        await createdIngredient.save();
        res.status(204).send();
    } catch(err) {
        if (err.name === "ValidationError") {
            var errors = [];
            Object.keys(err.errors).forEach(error => {
                const errorParts = error.split('.');
                const errorPart = errorParts[0];
                const indexPart = errorParts[1] || 0;
                
                errors.push({
                    path: errorPart,
                    type: err.errors[error].properties.type,
                    message: err.errors[error].properties.message,
                    index: indexPart
                });
            })
            return res.status(400).send(errors);
        } else if (err.name === "CustomValidationError") {
            var errors = [];
            
            Object.keys(err.errors).forEach(error => {
                const { type, message, index } = err.errors[error];
                errors.push({
                    path: error, type, message, index
                });
            })
            return res.status(400).send(errors);
        }
        res.status(500).send(err);
    }
}

module.exports.uploadImage = async (req, res) => {
    try {
        const { ingredient_id } = req.body;
        const ingredientImage = req.file || null;

        if (!ingredientImage)
            return res.status(400).send({ path: 'image', type: 'exist', message: 'No image was uploaded' });
        
        const ingredientDocument = await PrivateIngredient.findOne({ user_id: req.user._id, _id: ingredient_id });
        if (!ingredientDocument)
            return res.status(400).send({ path: 'ingredient_id', type: 'exist', message: 'Ingredient does not exist' });
        
        const uploadInfo = await FileOperations.uploadSingle('assets/private/images/', ingredientImage);
        if (ingredientDocument.image)
            await FileOperations.deleteSingle(ingredientDocument.image);
        ingredientDocument.image = uploadInfo.filepath;
        await ingredientDocument.save();
        res.status(204).send();
    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports.update = async (req, res) => {
    try {
        const { ingredient_id, name, description, type, category } = req.body;

        if (await PrivateIngredient.exists({ user_id: req.user._id, name, _id: { $ne: ingredient_id } }))
            return res.status(400).send({ path: 'name', type: 'exist', message: 'An ingredient with that name currently exists' });

        const ingredientDocument = await PrivateIngredient.findOne({ user_id: req.user._id, _id: ingredient_id });
        if (!ingredientDocument)
            return res.status(400).send({ path: 'ingredient_id', type: 'exist', message: 'Ingredient does not exist' });

        ingredientDocument.name = name;
        ingredientDocument.description = description;
        ingredientDocument.type = type;
        ingredientDocument.category = category;
        await ingredientDocument.validate();
        await ingredientDocument.customValidate();
        await ingredientDocument.save();

        res.status(204).send();
    } catch(err) {
        if (err.name === "ValidationError") {
            var errors = [];
            Object.keys(err.errors).forEach(error => {
                const errorParts = error.split('.');
                const errorPart = errorParts[0];
                const indexPart = errorParts[1] || 0;
                
                errors.push({
                    path: errorPart,
                    type: err.errors[error].properties.type,
                    message: err.errors[error].properties.message,
                    index: indexPart
                });
            })
            return res.status(400).send(errors);
        } else if (err.name === "CustomValidationError") {
            var errors = [];
            
            Object.keys(err.errors).forEach(error => {
                const { type, message, index } = err.errors[error];
                errors.push({
                    path: error, type, message, index
                });
            })
            return res.status(400).send(errors);
        }
        res.status(500).send(err);
    }
}

module.exports.delete = async (req, res) => {
    try {
        const { ingredient_id } = req.body;
        const ingredientDocument = await PrivateIngredient.findOne({ user_id: req.user._id, _id: ingredient_id });
        if (!ingredientDocument)
            return res.status(400).send({ path: 'ingredient_id', type: 'exist', message: 'Ingredient does not exist' });
        
        if (ingredientDocument.image)
            await FileOperations.deleteSingle(ingredientDocument.image);
        await ingredientDocument.remove();
        res.status(204).send();
    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports.getPrivate = async (req, res) => {
    try {
        const page = req.query.page || 1;
        const page_size = req.query.page_size || 10;
        var types = req.query.types ? JSON.parse(req.query.types) : null;
        var categories = req.query.categories ? JSON.parse(req.query.categories) : null;

    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports.getTypes = async (req, res) => {
    try {
        res.status(200).send(await PrivateIngredient.getTypes());
    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports.getCategories = async (req, res) => {
    try {
        const { ingredient_type } = req.query;
        res.status(200).send(await PrivateIngredient.getCategories(ingredient_type));
    } catch(err) {
        res.status(500).send(err);
    }
}
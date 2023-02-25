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
        
        const filepath = '/' + ingredientImage.destination + ingredientImage.filename;
        if (ingredientDocument.image) {
            try {
                await FileOperations.deleteSingle(ingredientDocument.image);
            } catch(err) {
                console.log(err);
            }
        }
        ingredientDocument.image = filepath;
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
        const ingredient_filters = req.query.ingredient_filters ? JSON.parse(req.query.ingredient_filters) : null;
        const ordering = req.query.ordering ? JSON.parse(req.query.ordering) : null;
        const errors = {};
        const filters = [];
        
        if (ingredient_filters) {
            const filterErrors = {};
            for (const typeIndex in Object.keys(ingredient_filters)) {
                const filterErr = {};
                const type = Object.keys(ingredient_filters)[typeIndex];
                for (const categoryIndex in Object.values(ingredient_filters)[typeIndex]) {
                    const category = Object.values(ingredient_filters)[typeIndex][categoryIndex];
                    const pairErr = await PrivateIngredient.validateTypeCategory(type, category);
                    if (Object.keys(pairErr).length) {
                        const errKey = Object.keys(pairErr)[0];
                        filterErr[`${errKey}.${categoryIndex}`] =  pairErr[errKey];
                        if (errKey === 'type')
                            break;
                    } else filters.push({ type, category });
                }
                if (Object.keys(filterErr).length)
                    filterErrors[`filter.${typeIndex}`] = filterErr;
            }
            if (Object.keys(filterErrors).length)
                errors['ingredient_filters'] = filterErrors;
        }
        
        if (ordering) {
            const orderingErrors = {};
            for (const orderingIndex in Object.keys(ordering)) {
                const orderingKey = Object.keys(ordering)[orderingIndex];
                if (!PrivateIngredient.schema.paths[orderingKey]) 
                    orderingErrors[`order.${orderingIndex}`] = { type: 'exist', message: 'Invalid sorting type' };
            }
            if (Object.keys(orderingErrors).length)
                errors['ordering'] = orderingErrors;
        }
        if (Object.keys(errors).length)
            return res.status(400).send(errors);

        const privateIngredients = await PrivateIngredient
            .find({ user_id: req.user._id })
            .typeCategoryFilter(filters)
            .sort(ordering)
            .skip((page - 1) * page_size)
            .limit(page_size)
            .userExposure();

        res.status(200).send(privateIngredients);
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
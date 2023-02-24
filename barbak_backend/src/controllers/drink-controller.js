const { PublicDrink, PrivateDrink } = require('../models/drink-model');
const FileOperations = require('../utils/file-operations');

module.exports.create = async (req, res) => {
    try {
        const { name, description, preparation_method, serving_style, drinkware, preparation, ingredients, tools, tags } = req.body;
        
        if (await PrivateDrink.exists({ user_id: req.user._id, name }))
            return res.status(400).send({ path: 'name', type: 'exist', message: 'A drink with name exists' });

        const createdDrink = new PrivateDrink({
            name, 
            description,
            preparation_method,
            serving_style,
            drinkware,
            preparation,
            ingredients,
            tools,
            tags,
            user_id: req.user._id
        });
        await createdDrink.validate();
        await createdDrink.customValidate();
        await createdDrink.save();

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
            return res.status(400).send(err);
        }
        res.status(500).send(err);
    }
}

module.exports.uploadImage = async (req, res) => {
    try {
        const { drink_id } = req.body;
        const drinkImages = req.files;
        
        if (!drinkImages.length)
            return res.status(400).send({ path: 'images', type: 'exist', message: 'No images were uploaded' });
        else if (drinkImages.length > 10)
            return res.status(400).send({ path: 'images', type: 'valid', message: 'Maximum of 10 images per drink' });

        const drinkDocument = await PrivateDrink.findOne({ user_id: req.user._id, _id: drink_id });
        if (!drinkDocument)
            return res.status(400).send({ path: 'drink_id', type: 'exist', message: 'Drink does not exist' });
        
        const uploadInfo = await FileOperations.uploadMultiple('assets/private/images/', drinkImages);
        const imagePaths = uploadInfo.map(image => image.filepath);

        if (drinkDocument.images.length) 
            await FileOperations.deleteMultiple(drinkDocument.images);
        drinkDocument.images = imagePaths;
        await drinkDocument.save();
        res.status(204).send();
    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports.update = async (req, res) => {
    try {
        const { drink_id, name, description, preparation_method, serving_style, drinkware, preparation, ingredients, tools, tags } = req.body;

        if (await PrivateDrink.exists({ user_id: req.user._id, name, _id: { $ne: drink_id } }))
            return res.status(400).send({ path: 'name', type: 'exist', message: 'A drink with that name currently exists' });

        const drinkDocument = await PrivateDrink.findOne({ user_id: req.user._id, _id: drink_id });
        if (!drinkDocument)
            return res.status(400).send({ path: 'drink_id', type: 'exist', message: 'Drink does not exist' });

        drinkDocument.name = name;
        drinkDocument.description = description;
        drinkDocument.preparation_method = preparation_method;
        drinkDocument.serving_style = serving_style;
        drinkDocument.drinkware = drinkware;
        drinkDocument.preparation = preparation;
        drinkDocument.ingredients = ingredients;
        drinkDocument.tools = tools;
        drinkDocument.tags = tags;
        
        await drinkDocument.validate();
        await drinkDocument.customValidate();
        await drinkDocument.save();

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
            return res.status(400).send(err);
        }
        res.status(500).send(err);
    }
}

module.exports.delete = async (req, res) => {
    try {
        const { drink_id } = req.body;

        const drinkDocument = await PrivateDrink.findOne({ user_id: req.user._id, _id: drink_id });
        if (!drinkDocument)
            return res.status(400).send({ path: 'drink_id', type: 'exist', message: 'Drink does not exist' });
        
        if (drinkDocument.images)
            await FileOperations.deleteMultiple(drinkDocument.images);
        await drinkDocument.remove();
        res.status(204).send();
    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports.getPrivate = async (req, res) => {
    // Finish This
}

module.exports.getPreparationMethods = async (req, res) => {
    try {
        res.status(200).send(await PrivateDrink.getPreparationMethods());
    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports.getServingStyles = async (req, res) => {
    try {
        res.status(200).send(await PrivateDrink.getServingStyles());
    } catch(err) {
        res.status(500).send(err);
    }
}
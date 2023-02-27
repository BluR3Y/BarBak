const FileOperations = require('../utils/file-operations');
const mongoose = require('mongoose');
const { PublicDrink, PrivateDrink } = require('../models/drink-model');
const DrinkRating = require('../models/drink_rating-model');

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
            return res.status(400).send({ path: 'image', type: 'exist', message: 'No image was uploaded' });

        const filepaths = drinkImages.map(img => '/' + img.destination + img.filename);
        if (!mongoose.Types.ObjectId.isValid(drink_id)) {
            await FileOperations.deleteMultiple(filepaths);
            return res.status(400).send({ path: 'drink_id', type: 'valid', message: 'Invalid drink Id' });
        }

        const drinkDocument = await PrivateDrink.findOne({ user_id: req.user._id, _id: drink_id });
        if (!drinkDocument) {
            await FileOperations.deleteMultiple(filepaths);
            return res.status(400).send({ path: 'drink_id', type: 'exist', message: 'Drink does not exist' });
        }

        if (drinkDocument.images.length)
            await FileOperations.deleteMultiple(drinkDocument.images);

        drinkDocument.images = filepaths;
        await drinkDocument.save();
        res.status(204).send();
    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports.update = async (req, res) => {
    try {
        const { drink_id, name, description, preparation_method, serving_style, drinkware, preparation, ingredients, tools, tags } = req.body;

        if (!mongoose.Types.ObjectId.isValid(drink_id))
            return res.status(400).send({ path: 'drink_id', type: 'valid', message: 'Invalid drink id' });

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

        if (!mongoose.Types.ObjectId.isValid(drink_id))
            return res.status(400).send({ path: 'drink_id', type: 'valid', message: 'Invalid drink id' });

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

module.exports.rate = async (req, res) => {
    try {
        const { drink_id, score, comment } = req.body;

        if (!mongoose.Types.ObjectId.isValid(drink_id))
            return res.status(400).send({ path: 'drink_id', type: 'valid', message: 'Invalid drink id' });

        const drinkDocument = await PublicDrink.findOne({ _id: drink_id });
        if (!drinkDocument)
            return res.status(400).send({ path: 'drink_id', type: 'exist', message: 'Drink does not exist' });

        const createdRating = new DrinkRating({
            referenced_drink: drink_id,
            score,
            comment
        });
        await createdRating.validate();
        await createdRating.save();
        res.status(204).send();
    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports.getPrivate = async (req, res) => {
    try {
        const page = req.query.page || 1;
        const page_size = req.query.page_size || 10;
        const ordering = req.query.ordering ? JSON.parse(req.query.ordering) : null;
        var preparation_methods = req.query.preparation_methods ? JSON.parse(req.query.preparation_methods) : null;
        var serving_styles = req.query.serving_styles ? JSON.parse(req.query.serving_styles) : null;
        const errors = {};

        if (preparation_methods) {
            const methodErrors = {};
            for (const methodIndex in preparation_methods) {
                if (!await PrivateDrink.validatePreparationMethod(preparation_methods[methodIndex]))
                    methodErrors[`method.${methodIndex}`] = { type: 'valid', message: 'Invalid preparation method' };
            }
            if (Object.keys(methodErrors).length)
                errors['preparation_methods'] = methodErrors;
        } else preparation_methods = await PrivateDrink.getPreparationMethods();

        if (serving_styles) {
            const styleErrors = {};
            for (const styleIndex in serving_styles) {
                if (!await PrivateDrink.validateServingStyle(serving_styles[styleIndex]))
                    styleErrors[`style.${styleIndex}`] = { type: 'valid', message: 'Invalid serving style' };
            }
            if (Object.keys(styleErrors).length)
                errors['serving_styles'] = styleErrors;
        } else serving_styles = await PrivateDrink.getServingStyles();

        if (ordering) {
            const orderingErrors = {};
            for (const orderingIndex in Object.keys(ordering)) {
                const orderingKey = Object.keys(ordering)[orderingIndex];
                if (!PrivateDrink.schema.paths[orderingKey]) 
                    orderingErrors[`order.${orderingIndex}`] = { type: 'exist', message: 'Invalid sorting type' };
            }
            if (Object.keys(orderingErrors).length)
                errors['ordering'] = orderingErrors;
        }

        if (Object.keys(errors).length)
            return res.status(400).send(errors);
        
        const userDrinks = await PrivateDrink
            .find({ user_id: req.user._id })
            .skip((page - 1) * page_size)
            .limit(page_size)
            .userExposure();

        res.status(200).send(userDrinks);
    } catch(err) {
        res.status(500).send(err);
    }
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
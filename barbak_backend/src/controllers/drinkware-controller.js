const { PublicDrinkware, PrivateDrinkware } = require('../models/drinkware-model');
const FileOperations = require('../utils/file-operations');
const mongoose = require('mongoose');

module.exports.create = async (req, res) => {
    try {
        const { name, description, material } = req.body;

        if (await PrivateDrinkware.exists({ user_id: req.user._id, name }))
            return res.status(400).send({ path: 'name', type: 'exist', message: 'A drinkware with that name currently exists' });

        const createdDrinkware = new PrivateDrinkware({
            name,
            description,
            material,
            user_id: req.user._id
        });
        await createdDrinkware.validate();
        await createdDrinkware.customValidate();
        await createdDrinkware.save();

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

module.exports.update = async (req, res) => {
    try {
        const { drinkware_id, name, description, material } = req.body;

        if (!mongoose.Types.ObjectId.isValid(drinkware_id))
            return res.status(400).send({ path: 'drinkware_id', type: 'valid', message: 'Invalid drinkware id' });

        if (await PrivateDrinkware.exists({ user_id: req.user._id, name, _id: { $ne: drinkware_id } }))
            return res.status(400).send({ path: 'name', type: 'exist', message: 'A tool with that name currently exists' });

        const drinkwareDocument = await PrivateDrinkware.findOne({ user_id: req.user._id, _id: drinkware_id });
        if (!drinkwareDocument)
            return res.status(400).send({ path: 'drnkware_id', type: 'exist', message: 'Drinkware does not exist' });
        
        drinkwareDocument.name = name;
        drinkwareDocument.description = description;
        drinkwareDocument.material = material;
        await drinkwareDocument.validate();
        await drinkwareDocument.customValidate();
        await drinkwareDocument.save();

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
        const { drinkware_id } = req.body;
        const drinkwareImage = req.file || null;

        if (!drinkwareImage)
            return res.status(400).send({ path: 'image', type: 'exist', message: 'No image was uploaded' });

        const filepath = '/' + drinkwareImage.destination + drinkwareImage.filename;
        if (!mongoose.Types.ObjectId.isValid(drinkware_id)) {
            await FileOperations.deleteSingle(filepath);
            return res.status(400).send({ path: 'drinkware_id', type: 'valid', message: 'Invalid Drinkware Id' });
        }

        const drinkwareDocument = await PrivateDrinkware.findOne({ user_id: req.user._id, _id: drinkware_id });
        if (!drinkwareDocument) {
            await FileOperations.deleteSingle(filepath);
            return res.status(400).send({ path: 'drinkware_id', type: 'exist', message: 'Drinkware does not exist' });
        }

        if (drinkwareDocument.image)
            await FileOperations.deleteSingle(drinkwareDocument.image);

        drinkwareDocument.image = filepath;
        await drinkwareDocument.save();
        res.status(204).send();
    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports.getPrivate = async (req, res) => {
    try {
        const page = req.query.page || 1;
        const page_size = req.query.page_size || 10;
        var materials = req.query.materials ? JSON.parse(req.query.materials) : null;
        const ordering = req.query.ordering ? JSON.parse(req.query.ordering) : null;
        const errors = {};
        
        if (materials) {
            const materialErrors = {};
            for (const materialIndex in materials) {
                if (!await PrivateDrinkware.validateMaterial(materials[materialIndex]))
                    materialErrors[`material.${materialIndex}`] = { type: 'valid', message: 'Invalid ingredient material' };
            }
            if (Object.keys(materialErrors).length)
                errors['materials'] = materialErrors;
        } else materials = await PrivateDrinkware.getMaterials();

        if (ordering) {
            const orderingErrors = {};
            for (const orderingIndex in Object.keys(ordering)) {
                const orderingKey = Object.keys(ordering)[orderingIndex];
                if (!PrivateDrinkware.schema.paths[orderingKey])
                    orderingErrors[`order.${orderingIndex}`] = { type: 'exist', message: 'Invalid sorting type' };
            }
            if (Object.keys(orderingErrors).length)
                errors['ordering'] = orderingErrors;
        }
        if (Object.keys(errors).length)
            return res.status(400).send(errors);

        const privateDocuments = await PrivateDrinkware
            .find({ user_id: req.user._id })
            .where('material').in(materials)
            .sort(ordering)
            .skip((page - 1) * page_size)
            .limit(page_size)
            .userExposure();

        res.status(200).send(privateDocuments);
    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports.getMaterials = async (req, res) => {
    try {
        res.status(200).send(await PrivateDrinkware.getMaterials());
    } catch(err) {
        console.log(err)
        res.status(500).send(err);
    }
}
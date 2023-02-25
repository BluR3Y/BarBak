const FileOperations = require('../utils/file-operations');
const { PublicTool, PrivateTool } = require('../models/tool-model');

module.exports.create = async (req, res) => {
    try {
        const { name, description, type, material } = req.body;

        if (await PrivateTool.exists({ user_id: req.user._id, name }))
            return res.status(400).send({ path: 'name', type: 'exist', message: 'A tool with that name currently exists' });
        
        const createdTool = new PrivateTool({
            name,
            description,
            type,
            material,
            user_id: req.user._id
        });
        await createdTool.validate();
        await createdTool.customValidate();
        await createdTool.save();
        
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
        const { tool_id } = req.body;
        const toolImage = req.file || null;

        if (!toolImage)
            return res.status(400).send({ path: 'image', type: 'exist', message: 'No image was uploaded' });

        const toolDocument = await PrivateTool.findOne({ user_id: req.user._id, _id: tool_id });
        if (!toolDocument)
            return res.status(400).send({ path: 'tool_id', type: 'exist', message: 'Tool does not exist' });

        const filepath = '/' + toolImage.destination + toolImage.filename;
        if (toolDocument.image) {
            try {
                await FileOperations.deleteSingle(toolDocument.image);
            } catch(err) {
                console.log(err);
            }
        }

        toolDocument.image = filepath;
        await toolDocument.save();
        res.status(204).send();
    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports.update = async (req, res) => {
    try {
        const { tool_id, name, description, type, material } = req.body;

        if (await PrivateTool.exists({ user_id: req.user._id, name, _id: { $ne:tool_id } }))
            return res.status(400).send({ path: 'name', type: 'exist', message: 'A tool with that name currently exists' });

        const toolDocument = await PrivateTool.findOne({ user_id: req.user._id, _id: tool_id });
        if (!toolDocument)
            return res.status(400).send({ path: 'tool_id', type: 'exist', message: 'Tool does not exist' });
        
        toolDocument.name = name;
        toolDocument.description = description;
        toolDocument.type = type;
        toolDocument.material = material;
        
        await toolDocument.validate();
        await toolDocument.customValidate();
        await toolDocument.save();

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
        const { tool_id } = req.body;

        const toolDocument = await PrivateTool.findOne({ user_id: req.user._id, _id: tool_id });
        if (!toolDocument)
            return res.status(400).send({ path: 'tool_id', type: 'exist', message: 'Tool does not exist' });

        if (toolDocument.image)
            await FileOperations.deleteSingle(toolDocument.image);

        await toolDocument.remove();
        res.status(204).send();
    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports.getPrivate = async (req, res) => {
    try {
        const page = req.query.page || 1;
        const page_size = req.query.page_size || 10;
        const ordering = req.query.ordering ? JSON.parse(req.query.ordering) : [];
        var types = req.query.types ? JSON.parse(req.query.types) : null;
        var materials = req.query.materials ? JSON.parse(req.query.materials) : null;
        const errors = {};

        if (types) {
            const typeErrors = {};
            for (const typeIndex in types) {
                if (!await PrivateTool.validateType(types[typeIndex]))
                    typeErrors[`type.${typeIndex}`] = { type: 'valid', message: 'Invalid tool type' };
            }
            if (Object.keys(typeErrors).length)
                errors['types'] = typeErrors;
        } else types = await PrivateTool.getTypes();

        if (materials) {
            const materialErrors = {};
            for (const materialIndex in materials) {
                if (!await PrivateTool.validateMaterial(materials[materialIndex]))
                    materialErrors[`material.${materialIndex}`] = { type: 'valid', message: 'Invalid tool material' };
            }
            if (Object.keys(materialErrors).length)
                errors['materials'] = materialErrors;
        } else materials = await PrivateTool.getMaterials();
        
        if (ordering) {
            const orderingErrors = {};
            for (const orderingIndex in Object.keys(ordering)) {
                const orderingKey = Object.keys(ordering)[orderingIndex];
                if (!PrivateTool.schema.paths[orderingKey]) 
                    orderingErrors[`order.${orderingIndex}`] = { type: 'exist', message: 'Invalid sorting type' };
            }
            if (Object.keys(orderingErrors).length)
                errors['ordering'] = orderingErrors;
        }

        if (Object.keys(errors).length)
            return res.status(400).send(errors);

        const userTools = await PrivateTool
            .find({ user_id: req.user._id })
            .where('type').in(types)
            .where('material').in(materials)
            .sort(ordering)
            .skip((page - 1) * page_size)
            .limit(page_size)
            .userExposure();

        res.status(200).send(userTools);
    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports.getTypes = async (req, res) => {
    try {
        const toolTypes = await PrivateTool.getTypes();
        res.status(200).send(toolTypes);
    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports.getMaterials = async (req, res) => {
    try {
        const toolMaterials = await PrivateTool.getMaterials();
        res.status(200).send(toolMaterials);
    } catch(err) {
        res.status(500).send(err);
    }
}
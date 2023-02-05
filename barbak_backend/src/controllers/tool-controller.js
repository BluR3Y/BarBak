const FileOperations = require('../utils/file-operations');

const Tool = require('../models/tool-model');

module.exports.create = async (req, res) => {
    try {
        const { name, description, type, material } = req.body;

        const createdTool = new Tool({
            name,
            description,
            type,
            material,
            user: req.user
        });
        await createdTool.validate();
        await createdTool.customValidate();

        const uploadInfo = req.file ? await FileOperations.uploadSingle('assets/tools/', req.file) : null;
        createdTool.image = uploadInfo ? uploadInfo.filename : null;
        await createdTool.save();
    } catch (err) {
        if (err.name === "ValidationError" || err.name === "CustomValidationError") {
            var errors = [];

            Object.keys(err.errors).forEach(error => {
                const errorParts = error.split('.');
                const errorPart = errorParts[0];
                const indexPart = errorParts[1] || '0';
                
                errors.push({ 
                    path: errorPart, 
                    type: (err.name === "ValidationError") ? err.errors[error].properties.type : err.errors[error], 
                    index: indexPart 
                });
            })
            return res.status(400).send(errors);
        }
        return res.status(500).send(err);
    }
    res.status(204).send();
}

module.exports.search = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const page_size = parseInt(req.query.page_size) || 5;
        const query = req.query.query || "";
        var types = req.query.types ? JSON.parse(req.query.types) : null;
        var materials = req.query.materials ? JSON.parse(req.query.materials) : null;

        if (page <= 0)
            return res.status(400).send({ path: 'page', type: 'valid' });
        else if (page_size > 20 || page_size < 1)
            return res.status(400).send({ path: 'page_size', type: 'valid' });
        
        if (types !== null) {
            for(const index in types) {
                if (!await Tool.validateType(types[index]))
                    return res.status(400).send({ path: 'types', type: 'valid', index });
            }
        } else 
            types = await Tool.getTypes();

        if (materials !== null) {
            for(const index in materials) {
                if (!await Tool.validateMaterial(materials[index]))
                    return res.status(400).send({ path: 'materials', type: 'valid', index });
            }
        } else
            materials = await Tool.getMaterials();

        const result = await Tool.find({ name: { $regex: query } })
            .where("type").in(types)
            .where("material").in(materials)
            .skip((page - 1) * page_size)
            .limit(page_size);
        
        res.status(200).send(result);
    } catch (err) {
        return res.status(500).send(err);
    }
}
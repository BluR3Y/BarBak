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
            console.log('hello')
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
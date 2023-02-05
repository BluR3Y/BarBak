const Ingredient = require('../models/ingredient-model');
const FileOperations = require('../utils/file-operations');

module.exports.create = async (req, res) => {
    try {
        const { name, description, type, category } = req.body;

        const createdIngredient = new Ingredient({
            name,
            description,
            type,
            category,
            user: req.user
        });
        await createdIngredient.validate();
        await createdIngredient.customValidate();
        
        const uploadInfo = req.file ? await FileOperations.uploadSingle('assets/ingredients/', req.file) : null;
        createdIngredient.image = uploadInfo ? uploadInfo.filename : null;
        createdIngredient.save();
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
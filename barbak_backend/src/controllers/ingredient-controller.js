const { PublicIngredient, PrivateIngredient } = require('../models/ingredient-model');
const FileOperations = require('../utils/file-operations');

module.exports.create = async (req, res) => {
    try {
        const { name, description, type, category } = req.body;

        if (await PrivateIngredient.exists({ user_id: req.user._id, name }))
            return res.status(400).send({ path: 'name', type: 'exist', message: 'An ingredient with that name currently exists' });

        const createdIngredient = new PrivateIngredient({
            name,
            description,
            type,
            category,
            user_id: req.user._id
        });
        await createdIngredient.validate();
        await createdIngredient.customValidate();
        
        const uploadInfo = req.file ? await FileOperations.uploadSingle('assets/private/images/', req.file) : null;
        console.log(uploadInfo)
        createdIngredient.image = uploadInfo ? uploadInfo.filepath : null;
        await createdIngredient.save();
        res.status(204).send();
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
        console.log(err)
        return res.status(500).send(err);
    }
}
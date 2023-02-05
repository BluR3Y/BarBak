const Drinkware = require('../models/drinkware-model');
const FileOperations = require('../utils/file-operations');

module.exports.create = async (req, res) => {
    try {
        const { name, description, material } = req.body;

        const createdDrinkware = new Drinkware({
            name,
            description,
            material,
            user: req.user
        });
        await createdDrinkware.validate();
        await createdDrinkware.customValidate();

        const uploadInfo = req.file ? await FileOperations.uploadSingle('assets/drinkware/', req.file) : null;
        createdDrinkware.image = uploadInfo ? uploadInfo.filename : null;
        createdDrinkware.save();
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

module.exports.publicize = async (req, res) => {
    
}
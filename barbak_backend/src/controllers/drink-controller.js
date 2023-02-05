const Drink = require('../models/drink-model');
const FileOperations = require('../utils/file-operations');

module.exports.create = async (req, res) => {
    try {
        const { name, description, preparation_method, serving_style, drinkware } = req.body;
        const ingredients = JSON.parse(req.body.ingredients);
        const tools = JSON.parse(req.body.tools);
        const preparation = JSON.parse(req.body.preparation);
        const tags = JSON.parse(req.body.tags);

        const createdDrink = new Drink({
            name,
            description,
            preparation_method,
            serving_style,
            ingredients,
            drinkware,
            tools,
            preparation,
            tags,
            user: req.user
        });
        await createdDrink.validate();
        await createdDrink.customValidate();

        const uploadInfo = req.files ? await FileOperations.uploadMultiple('assets/drinks/', req.files) : null;
        const filenames = uploadInfo.map(file => file.filename);
        createdDrink.images = filenames;
        await createdDrink.save();
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
    res.status(204).send(err);
}
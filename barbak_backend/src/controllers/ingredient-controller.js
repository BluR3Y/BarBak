const { isObject } = require('lodash');

const Ingredient = require('../models/ingredient-model');
const FileOperations = require('../utils/file-operations');

module.exports.create = async (req, res) => {
    const { name, description, type, category } = req.body;

    if(await Ingredient.exists({ name, user: req.user }))
        return res.status(400).send({ path: 'ingredient', type: 'exist' });
    
    const infoValidation = await Ingredient.validateInfo(type, category);
    if (infoValidation)
        return res.status(400).send({ path: infoValidation.path, type: 'valid' });

    try {
        const uploadInfo = req.file ? await FileOperations.uploadSingle('assets/ingredients/', req.file) : null;

        await Ingredient.create({
            name,
            description,
            type,
            category,
            image: uploadInfo ? uploadInfo.filename : null,
            user: req.user,
        });
    } catch (err) {
        return res.status(500).send(err);
    }
    res.status(204).send();
}
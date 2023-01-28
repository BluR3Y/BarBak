const _ = require('lodash');

const { Ingredient, AlcoholicIngredient } = require('../models/ingredient-model');
const FileOperations = require('../utils/file-operations');

module.exports.create = async (req, res) => {
    const { name, description, type, category, alcohol_by_volume } = req.body;
    const ingredientImage = req.file;

    if(await Ingredient.exists({ name, user: req.user }))
        return res.status(400).send({ path: 'ingredient', type: 'exists' });

    try {
        const uploadInfo = req.file ? await FileOperations.uploadSingle('assets/ingredients/', req.file) : null;

        if(Ingredient.isAlcoholic(type, category)) {
            await AlcoholicIngredient.create({
                name,
                description,
                type,
                category,
                alcohol_by_volume,
                image: uploadInfo ? uploadInfo.filename : null,
                user: req.user,
                visibility: 'private'
            });
        }else{
            await Ingredient.create({
                name,
                description,
                type,
                category,
                image: uploadInfo ? uploadInfo.filename : null,
                user: req.user,
                visibility: 'private'
            });
        }
    } catch(err) {
        return res.status(500).send(err);
    }

    res.status(204).send();
}
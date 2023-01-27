const { Ingredient, AlcoholicIngredient } = require('../models/ingredient-model');
const _ = require('lodash');

// module.exports.create = async (req, res) => {
//     const { name, description, type, category, alcohol_by_volume } = req.body;

//     if(await Ingredient.findOne({ user: req.user, name }))
//         return res.status(400).send({ path: 'ingredient', type: 'exist' });

//     try {
//         if(category === 'alcohol') {
//             const { alcohol_category, alcohol_by_volume } = req.body;
//             await AlcoholicIngredient.create({
//                 name, 
//                 description,
//                 category,
//                 alcohol_category,
//                 alcohol_by_volume,
//                 user: req.user,
//                 visibility: 'private'
//             });
//         }else{
//             await Ingredient.create({
//                 name,
//                 description,
//                 category,
//                 user: req.user,
//                 visibility: 'private'
//             });
//         }
//     } catch(err) {
//         return res.status(500).send(err);
//     }
//     res.status(204).send();
// }

module.exports.create = async (req, res) => {
    const { name, description, type, category, alcohol_by_volume } = req.body;
    const ingredientImage = req.file;

    if(await Ingredient.exists({ name, user: req.user }))
        return res.status(400).send({ path: 'ingredient', type: 'exists' });

    try {
        if(Ingredient.isAlcoholic(type, category)) {
            await AlcoholicIngredient.create({
                name,
                description,
                type,
                category,
                alcohol_by_volume,
                image: ingredientImage ? ingredientImage.filename : null,
                user: req.user,
                visibility: 'private'
            });
        }else{
            await Ingredient.create({
                name,
                description,
                type,
                category,
                image: ingredientImage ? ingredientImage.filename : null,
                user: req.user,
                visibility: 'private'
            });
        }
    } catch(err) {
        return res.status(500).send(err);
    }

    res.status(204).send();
}
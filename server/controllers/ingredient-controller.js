const { Ingredient, AlcoholIngredient } = require('../models/ingredient-model');

module.exports.create_ingredient = async (req, res) => {
    const validation = req.body.category === 'alcohol' ? AlcoholIngredient.validate(req.body) : Ingredient.validate(req.body);

    if(validation.error) {
        const { path, type } = validation.error.details[0];
        return res.status(400).send({ path: path[0], type });
    }
    const { name, description, category } = validation.value;

    if(await Ingredient.findOne({ user: req.user, name }))
        return res.status(400).send({ path: 'ingredient', type: 'exists' });

    try {
        if(category === 'alcohol') {
            const { alcohol_category ,alcohol_by_volume } = validation.value;

            await AlcoholIngredient.create({
                name,
                description,
                category,
                alcohol_category,
                alcohol_by_volume,
                user: req.user,
                visibility: 'private'
            });
            res.status(204).send();
        } else {
            await Ingredient.create({
                name,
                description,
                category,
                user: req.user,
                visibility: 'private'
            });
            res.status(204).send();
        }
    } catch(err) {
        res.status(500).send(err);
    }
}
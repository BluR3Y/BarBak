const { Ingredient, AlcoholIngredient } = require('../models/ingredient-model');

module.exports.create_ingredient = async (req, res) => {

    const createdIngredient = await AlcoholIngredient.create({
        name: 'Test',
        description: 'lol test',
        category: 'alcohsol',
        user: req.user,

    });
    console.log(createdIngredient)

    res.status(200).send();
}
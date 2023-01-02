const { Ingredient, AlcoholIngredient } = require('../models/ingredient-model');

module.exports.create_ingredient = async (req, res) => {

    // const createdIngredient = await AlcoholIngredient.create({
    //     name: 'Test',
    //     description: 'lol test',
    //     category: 'alcohol',
    //     user: req.user,
    //     alcohol_by_volume: [1]
    // });
    // console.log(createdIngredient)

    const { name, description, category, alcohol_by_volume } = req.body;

    try {
        await AlcoholIngredient.create({
            name,
            description,
            category, 
            alcohol_by_volume,
        });
        res.send(204).send();
    } catch(err) {
        res.status(400).send('Error');
    }

    res.status(200).send();
}
const Drink = require('../models/drink-model');

module.exports.create_drink = async (req, res) => {
    const validation = Drink.createDrinkValidator(req.body);

    if(validation.error) {
        const { path, type } = validation.error.details[0];
        return res.status(400).send({ path:path[0], type });
    }
    const { name, description, drink_category, mixing_style, serving_style, ingredients, drinkware, equipment, preparation, tags } = validation.value;

    console.log(ingredients)

    res.status(400).send('Hellso');
}
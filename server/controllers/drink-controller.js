const Drink = require('../models/drink-model');
const drinkValidators = require('../validators/drink-validators');

module.exports.create_drink = async (req, res) => {
    const validation = Drink.createDrinkValidator(req.body);
    console.log(validation)

    res.status(400).send('Hello');
}
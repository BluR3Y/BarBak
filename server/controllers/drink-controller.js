const Drink = require('../models/drink-model');
const drinkValidators = require('../validators/drink-validators');

module.exports.create_user_drink = async (req, res) => {

    try {
        const createdDrink = await Drink.create({
            name: "manhattan",
            type: "cocktail",
        })
        console.log(createdDrink)
    } catch(err) {
        console.log(err)
    }

    res.send('Create Drink!');
}
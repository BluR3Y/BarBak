const { Drink, VerifiedDrink, UserDrink } = require('../models/drink-model');


module.exports.create = async (req, res) => {
    try {

    } catch(err) {
        console.error(err);
        res.status(500).send(err);
    }
}
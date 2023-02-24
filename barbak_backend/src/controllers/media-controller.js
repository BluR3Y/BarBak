const { BaseTool } = require('../models/tool-model');
const { BaseDrinkware } = require('../models/drinkware-model');
const { BaseIngredient } = require('../models/ingredient-model');
const { BaseDrink } = require('../models/drink-model');

module.exports.search = async (req, res) => {
    try {
        const query = req.query.query || null;
        console.log(query)

        res.status(200).send('lol');
    } catch(err) {
        res.status(500).send(err);
    }
}
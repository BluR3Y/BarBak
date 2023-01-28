const Drink = require('../models/drink-model');
const Drinkware = require('../models/drinkware-model');
const { Ingredient } = require('../models/ingredient-model');
const Tool = require('../models/tool-model');
const FileOperations = require('../utils/file-operations');

module.exports.create = async (req, res) => {

    const { name, description, preparation_method, serving_style, drinkware } = req.body;
    const ingredients = JSON.parse(req.body.ingredients);
    const tools = JSON.parse(req.body.tools);
    const preparation = JSON.parse(req.body.preparation);
    const tags = JSON.parse(req.body.tags);
    
    if(await Drink.findOne({ user: req.user, name }))
        return res.status(400).send({ path: 'drink', type: 'exist' });
    
    for(const item in ingredients) {
        const ingredientInfo = await Ingredient.findOne({ _id: ingredients[item].ingredientId });
        if(!ingredientInfo)
            return res.status(400).send({ path: 'ingredient', type: 'exist', item: ingredients[item].ingredientId });
    }

    for(const item in drinkware) {
        const drinkwareInfo = await Drinkware.findOne({ _id: drinkware });
        if(!drinkwareInfo)
            return res.status(400).send({ path: 'drinkware', type: 'exist', item: drinkware[item].drinkwareId });
    }

    for(const item in tools) {
        const toolInfo = await Tool.findOne({ _id: tools[item] });
        if(!toolInfo)
            return res.status(400).send({ path: 'tool', type: 'exist', item: tools[item].toolId });
    }
    
    try {
        const uploadInfo = req.files ? await FileOperations.uploadMultiple('assets/drinks/', req.files) : null;
        const filenames = uploadInfo.map(file => file.filename);

        await Drink.create({
            name,
            description,
            preparation_method,
            serving_style,
            ingredients,
            drinkware,
            tools,
            preparation,
            tags,
            images: filenames,
            user: req.user,
            visibility: 'private'
        });
    } catch(err) {
        return res.status(500).send(err);
    }
    res.status(204).send();
}

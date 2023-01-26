const Drink = require('../models/drink-model');
const Drinkware = require('../models/drinkware-model');
const { Ingredient } = require('../models/ingredient-model');
const Tool = require('../models/tool-model');

// module.exports.create_drink = async (req, res) => {
//     const validation = Drink.createDrinkValidator(req.body);

//     if(validation.error) {
//         const { path, type } = validation.error.details[0];
//         return res.status(400).send({ path:path[0], type });
//     }
//     const { name, description, drink_category, preparation_method, serving_style, ingredients, drinkware, tools, preparation, tags } = validation.value;

//     try {
//         if(await Drink.findOne({ user: req.user, name }))
//             return res.status(400).send({ path: 'drink', type: 'exists' });

//         for(const item in ingredients) {
//             const ingredientInfo = await Ingredient.findOne({ _id: ingredients[item].ingredientId, user: req.user }, 'name');
//             if(!ingredientInfo)
//                 return res.status(400).send({ path: 'ingredient', type: 'exists' });
//         }
//         for(const item in drinkware) {
//             const drinkwareInfo = await Drinkware.findOne({ _id: drinkware[item].drinkwareId, user: req.user }, 'name');
//             if(!drinkwareInfo)
//                 return res.status(400).send({ path: 'drinkware', type: 'exists' });
//         }
//         for(const item in tools) {
//             const toolInfo = await Tool.findOne({ _id: tools[item].toolId, user: req.user });
//             if(!toolInfo)
//                 return res.status(400).send({ path: 'tool', type: 'exists' });
//         }

//         await Drink.create({
//             name,
//             description,
//             drink_category,
//             preparation_method,
//             serving_style,
//             ingredients,
//             drinkware,
//             tools,
//             preparation,
//             tags
//         });
//         res.status(204).send();
        
//     } catch(err) {
//         res.status(500).send(err);
//     }
// }

module.exports.create = async (req, res) => {
    const { name, description, drink_category, preparation_method, serving_style, ingredients, drinkware, tools, preparation, tags } = req.body;

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
        await Drink.create({
            name,
            description,
            drink_category,
            preparation_method,
            serving_style,
            ingredients,
            drinkware,
            tools,
            preparation,
            tags,
            user: req.user,
            visibility: 'private'
        });
    } catch(err) {
        return res.status(500).send(err);
    }
    res.status(204).send();
}
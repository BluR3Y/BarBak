const Drink = require('../models/drink-model');
const FileOperations = require('../utils/file-operations');

// module.exports.create = async (req, res) => {

//     const { name, description, preparation_method, serving_style, drinkware } = req.body;
//     const ingredients = JSON.parse(req.body.ingredients);
//     const tools = JSON.parse(req.body.tools);
//     const preparation = JSON.parse(req.body.preparation);
//     const tags = JSON.parse(req.body.tags);
    
//     if(await Drink.findOne({ user: req.user, name }))
//         return res.status(400).send({ path: 'drink', type: 'exist' });
    
//     for(const item in ingredients) {
//         const ingredientInfo = await Ingredient.findOne({ _id: ingredients[item].ingredientId });
//         if(!ingredientInfo)
//             return res.status(400).send({ path: 'ingredient', type: 'exist', item: ingredients[item].ingredientId });

//         const ingredient_type_id = await executeSqlQuery(`SELECT type_id FROM ingredient_types WHERE name = '${ingredientInfo.type}';`)
//             .then(res => res[0].type_id);
//         const ingredient_measure_state = await executeSqlQuery(`SELECT measure_state FROM ingredient_categories WHERE type_id = ${ingredient_type_id} AND name = '${ingredientInfo.category}';`);
//         console.log(ingredient_measure_state)
//     }

//     for(const item in drinkware) {
//         const drinkwareInfo = await Drinkware.findOne({ _id: drinkware });
//         if(!drinkwareInfo)
//             return res.status(400).send({ path: 'drinkware', type: 'exist', item: drinkware[item].drinkwareId });
//     }

//     for(const item in tools) {
//         const toolInfo = await Tool.findOne({ _id: tools[item] });
//         if(!toolInfo)
//             return res.status(400).send({ path: 'tool', type: 'exist', item: tools[item].toolId });
//     }
    
//     try {
//         const uploadInfo = req.files ? await FileOperations.uploadMultiple('assets/drinks/', req.files) : null;
//         const filenames = uploadInfo.map(file => file.filename);

//         await Drink.create({
//             name,
//             description,
//             preparation_method,
//             serving_style,
//             ingredients,
//             drinkware,
//             tools,
//             preparation,
//             tags,
//             images: filenames,
//             user: req.user,
//             visibility: 'private'
//         });
//     } catch(err) {
//         return res.status(500).send(err);
//     }
//     res.status(204).send();
// }


module.exports.create = async (req, res) => {
    try {
        const { name, description, preparation_method, serving_style, drinkware } = req.body;
        const ingredients = JSON.parse(req.body.ingredients);
        const tools = JSON.parse(req.body.tools);
        const preparation = JSON.parse(req.body.preparation);
        const tags = JSON.parse(req.body.tags);

        const createdDrink = new Drink({
            name,
            description,
            preparation_method,
            serving_style,
            ingredients,
            drinkware,
            tools,
            preparation,
            tags,
            user: req.user
        });
        await createdDrink.validate();
        await createdDrink.validateDrinkware();
        await createdDrink.validateTools();
        await createdDrink.validateIngredients();

        const uploadInfo = req.files ? await FileOperations.uploadMultiple('assets/drinks/', req.files) : null;
        const filenames = uploadInfo.map(file => file.filename);

        createdDrink.images = filenames;

        await createdDrink.save();
        
    } catch (err) {
        if (err.name === "ValidationError") {
            var errors = [];
            
            Object.keys(err.errors).forEach(error => {
                const errorParts = error.split('.');
                const errorPart = errorParts[0];
                const indexPart = errorParts[1] || '0';
                
                errors.push({ path: errorPart, type: err.errors[error].properties.type, index: indexPart });
            })
            return res.status(400).send(errors);
        } else if (err.name === "CustomValidationError") {
            var errors = [];
            
            Object.keys(err.errors).forEach(error => {
                const errorParts = error.split('.');
                const errorPart = errorParts[0];
                const indexPart = errorParts[1] || '0';
                
                errors.push({ path: errorPart, type: err.errors[error], index: indexPart });
            })
            return res.status(400).send(errors);
        }
        return res.status(500).send(err);
    }
    res.status(204).send();
}
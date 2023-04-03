const { subject } = require('@casl/ability');
const { Drink, VerifiedDrink, UserDrink } = require('../models/drink-model');
const responseObject = require('../utils/response-object');
const _ = require('lodash');

module.exports.create = async (req, res) => {
    try {
        const { drink_type = 'user' } = req.params;

        if (!req.ability.can('create', subject('drinks', { subject_type: drink_type })))
            return res.status(403).send({ path: 'verified', type: 'valid', message: 'Unauthorized to create drink' });
        else if (drink_type === 'user' ?
            await UserDrink.exists({ user: req.user._id, name: req.body.name }) :
            await VerifiedDrink.exists({ name: req.body.name })
        )
            return res.status(400).send({ path: 'name', type: 'exist', message: 'A drink with that name currently exists' });
        
        const createdDrink = (drink_type === 'user' ?
            new UserDrink({ ...req.body, user: req.user._id }) :
            new VerifiedDrink(req.body)
        );

        await createdDrink.validate();
        await createdDrink.customValidate();
        await createdDrink.save();
        
        const responseFields = [
            { name: '_id', alias: 'id' },
            { name: 'name' },
            { name: 'verified' }
        ];
        res.status(201).send(createdDrink.responseObject(responseFields));
    } catch(err) {
        if (err.name === 'ValidationError' || err.name === 'CustomValidationError')
            return res.status(400).send(err);
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

module.exports.update = async (req, res) => {
    try {
        const { name, description, preparation_method, serving_style, drinkware, preparation, ingredients, tools, tags } = req.body;
        const { drink_id } = req.params;
        const drinkInfo = await Drink.findOne({ _id: drink_id });

        if (!drinkInfo)
            return res.status(404).send({ path: 'drink_id', type: 'exist', message: 'Drink does not exist' });
        else if (!req.ability.can('update', subject('drinks', drinkInfo)))
            return res.status(403).send({ path: 'drink_id', type: 'valid', message: 'Unauthorized request' });
        else if (
            (drinkInfo.model === 'User Drink' && await UserDrink.exists({ user: req.user._id, name, _id: { $ne: drink_id } })) ||
            (drinkInfo.model === 'Verified Drink' && await VerifiedDrink.exists({ name, _id: { $ne: drink_id } }))
        )
            return res.status(400).send({ path: 'name', type: 'exist', message: 'A drink with that name currently exists' });

        drinkInfo.set({
            name,
            description,
            preparation_method,
            serving_style,
            drinkware,
            preparation,
            ingredients,
            tools,
            tags
        });
        await drinkInfo.validate();
        await drinkInfo.customValidate();
        await drinkInfo.save();

        res.status(204).send();
    } catch(err) {
        if (err.name === 'ValidationError' || err.name === 'CustomValidationError')
            return res.status(400).send(err);
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

// module.exports.getDrink = async (req, res) => {
//     try {
//         const { drink_id, privacy_type = 'public' } = req.params;
//         const drinkInfo = await Drink
//             .findOne({ _id: drink_id })
//             .populate('drinkwareInfo');

//         if (!drinkInfo)
//             return res.status(404).send({ path: 'drink_id', type: 'exist', message: 'Drink does not exist' });
//         else if (!req.ability.can('read', subject('drinks', { action_type: privacy_type, document: drinkInfo })))
//             return res.status(403).send({ path: 'drink_id', type: 'valid', message: 'Unauthorized request' });

//         const responseFields = [
//             { name: '_id', alias: 'id' },
//             { name: 'name' },
//             { name: 'description' },
//             { name: 'preparation_method' },
//             { name: 'serving_style' },
//             { name: 'preparation' },
//             { name: 'ingredients' },
//             { name: 'tools' },
//             { name: 'tags' },
//             { name: 'assets' },
//             { name: 'verified' },
//             {
//                 name: 'user',
//                 condition: (document) => document instanceof UserDrink
//             },
//             { name: 'drinkwareInfo.cover_url', alias: 'drinkware.cover' },
//             { name: 'ingredients.ingredient_id', array: true }
//         ];
//         res.status(200).send(drinkInfo.responseObject(responseFields));
//     } catch(err) {
//         console.error(err);
//         res.status(500).send('Internal server error');
//     }
// }

module.exports.getDrink = async (req, res) => {
    try {
        const { drink_id, privacy_type = 'public' } = req.params;
        const drinkInfo = await Drink
            .findOne({ _id: drink_id })
            .populate('drinkwareInfo toolInfo ingredientInfo');

        const responseFields = [
            { name: '_id', alias: 'id' },
            { name: 'name' },
            { name: 'description' },
            { name: 'preparation_method' },
            { name: 'serving_style' },
            { name: 'preparation' },
            { name: 'ingredientInfo', alias: 'ingredients', sub_fields: [
                { name: '_id', alias: 'id' },
                { name: 'name' },
                { name: 'description' },
                { name: 'cover_url', alias: 'cover' }
            ] },
            { name: 'drinkwareInfo', alias: 'drinkware', sub_fields: [
                { name: '_id', alias: 'id' },
                { name: 'name' },
                { name: 'description' },
                { name: 'cover_url', alias: 'cover' },
            ] },
            { name: 'toolInfo', alias: 'tools', sub_fields: [
                { name: '_id', alias: 'id' },
                { name: 'name' },
                { name: 'description' },
                { name: 'category' },
                { name: 'cover_url' , alias: 'cover'},
            ] },
            { name: 'tags' },
        ];
        
        res.status(200).send(responseObject(drinkInfo, responseFields));
    } catch(err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

module.exports.clientDrinks = async (req, res) => {
    try {

        // .categoryFilter(category_filter)
        // .sort(ordering)
        // .skip((page - 1) * page_size)
        // .limit(page_size)
        // .extendedInfo();
        
        const userDocuments = await Drink
            .find({ user: req.user._id })
            .extendedInfo();
            
        res.status(200).send(userDocuments);
    } catch(err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
}
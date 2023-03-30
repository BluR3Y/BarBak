const { subject } = require('@casl/ability');
const { Drink, VerifiedDrink, UserDrink } = require('../models/drink-model');


module.exports.create = async (req, res) => {
    try {
        const { name, description, preparation_method, serving_style, drinkware, preparation, ingredients, tools, tags, verified } = req.body;
        
        if (!req.ability.can('create', subject('drinks', { verified })))
            return res.status(403).send({ path: 'verified', type: 'valid', message: 'Unauthorized to create drink' });
        else if (
            (verified && await VerifiedDrink.exists({ name })) ||
            (!verified && await UserDrink.exists({ user: req.user._id, name }))
        )
            return res.status(400).send({ path: 'name', type: 'exist', message: 'A drink with that name currently exists' });

        const createdDrink = ( verified ? new VerifiedDrink({
            name,
            description,
            preparation_method,
            serving_style,
            drinkware,
            preparation,
            ingredients,
            tools,
            tags
        }) : new UserDrink({
            name,
            description,
            preparation_method,
            serving_style,
            drinkware,
            preparation,
            ingredients,
            tools,
            tags,
            user: req.user._id
        }) );
        await createdDrink.validate();
        await createdDrink.customValidate();
        await createdDrink.save();

        res.status(204).send();
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

module.exports.getDrink = async (req, res) => {
    try {
        const { drink_id } = req.params;
        const drinkInfo = await Drink.findOne({ _id: drink_id });

        if (!drinkInfo)
            return res.status(404).send({ path: 'drink_id', type: 'exist', message: 'Drink does not exist' });
        else if (!req.ability.can('read', subject('drinks', drinkInfo)))
            return res.status(403).send({ path: 'drink_id', type: 'valid', message: 'Unauthorized request' });

        res.status(200).send(await drinkInfo.basicStripExcess());
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
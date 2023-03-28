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

    } catch(err) {
        if (err.name === 'ValidationError' || err.name === 'CustomValidationError')
            return res.status(400).send(err);
        console.error(err);
        res.status(500).send(err);
    }
}
const { subject } = require('@casl/ability');
const { Ingredient, VerifiedIngredient, UserIngredient } = require('../models/ingredient-model');
const { AppAccessControl } = require('../models/access-control-model');
const s3Operations = require('../utils/aws-s3-operations');

module.exports.create = async (req, res) => {
    try {
        const { name, description, category, sub_category, verified } = req.body;

        if (!req.ability.can('create', subject('ingredients', { verified })))
            return res.status(403).send({ path: 'verified', type: 'valid', message: 'Unauthorized to create ingredient' });
        else if (
            (verified && await VerifiedIngredient.exists({ name })) ||
            (!verified && await UserIngredient.exists({ user: req.user._id, name }))
        )
            return res.status(400).send({ path: 'name', type: 'exist', message: 'An ingredient with that name currently exists' });
        
        const createdIngredient = ( verified ? new VerifiedIngredient({
            name,
            description,
            category,
            sub_category
        }) : new UserIngredient({
            name,
            description,
            category,
            sub_category,
            user: req.user._id
        }) );
        await createdIngredient.validate();
        await createdIngredient.customValidate();
        await createdIngredient.save();
        res.status(204).send();
    } catch(err) {
        if (err.name === 'ValidationError' || err.name === 'CustomValidationError')
            return res.status(400).send(err);
        res.status(500).send(err);
    }
}

module.exports.update = async (req, res) => {
    try {
        const { ingredient_id, name, description, category, sub_category } = req.body;
        const ingredientInfo = await Ingredient.findOne({ _id: ingredient_id });

        if (!ingredientInfo)
            return res.status(404).send({ path: 'ingredient_id', type: 'exist', message: 'Ingredient does not exist' });
        else if (!req.ability.can('update', subject('ingredients', ingredientInfo)))
            return res.status(403).send({ path: 'ingredient_id', type: 'valid', message: 'Unauthorized request' });
        else if (
            (ingredientInfo.model === 'User Ingredient' && await UserIngredient.exists({ user: req.user._id, _id: { $ne: ingredient_id } })) ||
            (ingredientInfo.model === 'Verified Ingredient' && await VerifiedIngredient.exists({ name, _id: { $ne: ingredient_id } }))
        )
            return res.status(400).send({ path: 'name', type: 'exist', message: 'An ingredient with that name currently exists' });

        ingredientInfo.name = name;
        ingredientInfo.description = description;
        ingredientInfo.category = category;
        ingredientInfo.sub_category = sub_category;

        await ingredientInfo.validate();
        await ingredientInfo.customValidate();
        await ingredientInfo.save();
        res.status(204).send();
    } catch(err) {
        if (err.name === 'ValidationError' || err.name === 'CustomValidationError')
            return res.status(400).send(err);
        res.status(500).send(err);
    }
}

module.exports.delete = async (req, res) => {
    try {
        const { ingredient_id } = req.body;
        const ingredientInfo = await Ingredient.findOne({ _id: ingredient_id });

        if (!ingredientInfo)
            return res.status(404).send({ path: 'ingredient_id', type: 'exist', message: 'Ingredient does not exist' });
        else if (!req.ability.can('delete', subject('ingredients', ingredientInfo)))
            return res.status(403).send({ path: 'ingredient_id', type: 'valid', message: 'Unauthorized request' });

        if (ingredientInfo.model === 'User Ingredient' && ingredientInfo.cover_acl) {
            const aclDocument = await AppAccessControl.findOne({ _id: ingredientInfo.cover_acl });
            await s3Operations.removeObject(aclDocument.file_path);
            await aclDocument.remove();
        } else if (ingredientInfo.model === 'Verified Ingredient' && ingredientInfo.cover)
            await s3Operations.removeObject(ingredientInfo.cover);

        await ingredientInfo.remove();
        res.status(204).send();
    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports.updatePrivacy = async (req, res) => {
    try {
        const { ingredient_id } = req.params;
        const ingredientInfo = await UserIngredient.findOne({ _id: ingredient_id });

        if (!ingredientInfo)
            return res.status(404).send({ path: 'ingredient_id', type: 'exist', message: 'Ingredient does not exist' });
        else if(!req.ability.can('patch', subject('ingredients', ingredientInfo)))
            return res.status(403).send({ path: 'ingredient_id', type: 'valid', message: 'Unauthorized request' });

        ingredientInfo.public = !ingredientInfo.public;
        await ingredientInfo.save();
        res.status(200).send(ingredientInfo);
    } catch(err) {
        res.status(500).send(err);
    }
}

// Stopped Here ************
const { Drink, VerifiedDrink, UserDrink } = require('../models/drink-model');
const { ForbiddenError: CaslError } = require('@casl/ability');
const responseObject = require('../utils/response-object');
const fileOperations = require('../utils/file-operations');
const s3Operations = require('../utils/aws-s3-operations');
const AppError = require('../utils/app-error');

module.exports.create = async (req, res, next) => {
    try {
        const createdDrink = req.params.drink_type === 'verified' ?
            new VerifiedDrink(req.body) :
            new UserDrink({ ...req.body, user: req.user._id });
        CaslError.from(req.ability)
            .setMessage('Unauthorized to create drink')
            .throwUnlessCan('create', createdDrink);
        await createdDrink.save();

        const response = await responseObject(createdDrink, [
            { name: '_id', alias: 'id' },
            { name: 'name' },
            { name: 'preparation_method' },
            { name: 'verified' }
            // Modify response
        ]);
        res.status(201).send(response);
    } catch(err) {
        next(err);
    }
}

module.exports.modify = async (req, res, next) => {
    try {
        const { drink_id } = req.params;
        const drinkInfo = await Drink.findById(drink_id);

        if (!drinkInfo)
            throw new AppError(404, 'NOT_FOUND', 'Drink does not exist');
        
        const allowedFields = drinkInfo.accessibleFieldsBy(req.ability, 'update');
        if (![...Object.keys(req.body), ...(req.file ? [req.file.fieldname] : [])].every(field => allowedFields.includes(field)))
            throw new CaslError().setMessage('Unauthorized to modify drink');

        drinkInfo.set(req.body);
        if (req.file) {
            const uploadInfo = await s3Operations.createObject(req.file, 'assets/drinks/images/cover');
            drinkInfo.cover = uploadInfo.filepath;
        }
        await drinkInfo.save();
        res.status(204).send();
    } catch(err) {
        next(err);
    } finally {
        if (req.file) {
            fileOperations.deleteSingle(req.file.path)
            .catch(err => console.error(err));
        }
    }
}

module.exports.delete = async (req, res, next) => {
    try {
        const { drink_id } = req.params;
        const drinkInfo = await Drink.findById(drink_id);

        if (!drinkInfo)
            throw new AppError(404, 'NOT_FOUND', 'Drink does not exist');
        CaslError.from(req.ability)
            .setMessage('Unauthorized to delete drink')
            .throwUnlessCan('delete', drinkInfo);

        await drinkInfo.remove();
        res.status(204).send();
    } catch(err) {
        next(err);
    }
}

module.exports.copy = async (req, res, next) => {
    try {
        const { drink_id } = req.params;
        const drinkInfo = await Drink.findById(drink_id);

        if (!drinkInfo)
            throw new AppError(404, 'NOT_FOUND', 'Drink does not exist');

        const allowedFields = drinkInfo.accessibleFieldsBy(req.ability, 'read');
        const requiredFields = ['name', 'description', 'preparation_method', 'serving_style', 'drinkware', 'preparation', 'ingredients', 'tools', 'tags'];
        if (![...requiredFields, 'cover'].every(field => allowedFields.includes(field)))
            throw new CaslError().setMessage('Unauthorized to copy drink');

        const createdDrink = new UserDrink({
            ...(requiredFields.reduce((accumulator, current) => ({
                ...accumulator,
                [current]: drinkInfo[current]
            }), {})),
            user: req.user._id
        });
        CaslError.from(req.ability)
            .setMessage('Unauthorized to create drink')
            .throwUnlessCan('create', createdDrink);

        if (drinkInfo.cover) {
            const copyInfo = await s3Operations.copyObject(drinkInfo.cover);
            createdDrink.cover = copyInfo.filepath;
        }
        await createdDrink.save();
        res.status(204).send();
    } catch(err) {
        next(err);
    }
}

module.exports.getDrink = async (req, res, next) => {
    try {

    } catch(err) {
        next(err);
    }
}

module.exports.search = async (req, res, next) => {
    try {

    } catch(err) {
        next(err);
    }
}

module.exports.clientDrinks = async (req, res, next) => {
    try {

    } catch(err) {
        next(err);
    }
}

module.exports.getPreparationMethods = async (req, res, next) => {
    try {

    } catch(err) {
        next(err);
    }
}

module.exports.getServingStyles = async (req, res, next) => {
    try {

    } catch(err) {
        next(err);
    }
}
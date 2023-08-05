const { Ingredient, VerifiedIngredient, UserIngredient } = require('../models/ingredient-model');
const { ForbiddenError: CaslError } = require('@casl/ability');
const s3Operations = require('../utils/aws-s3-operations');
const fileOperations = require('../utils/file-operations');
const responseObject = require('../utils/response-object');
const AppError = require('../utils/app-error');

module.exports.create = async (req, res, next) => {
    try {
        const createdIngredient = req.params.ingredient_type === 'verified' ?
            new VerifiedIngredient(req.body) :
            new UserIngredient({ ...req.body, user: req.user._id });
        CaslError.from(req.ability)
            .setMessage('Unauthorized to create ingredient')
            .throwUnlessCan('create', createdIngredient);
        await createdIngredient.save();

        const response = await responseObject(createdIngredient, [
            { name: '_id', alias: 'id' },
            { name: 'name' },
            { name: 'description' },
            { name: 'classification_info', parent_fields: [
                { name: 'category' },
                { name: 'sub_category' }
            ] },
            { name: 'verified' },
            {
                name: 'user',
                condition: (document) => document instanceof UserIngredient
            },
            {
                name: 'public',
                condition: (document) => document instanceof UserIngredient
            },
            {
                name: 'date_created',
                ...(createdIngredient instanceof VerifiedIngredient && { alias: 'date_verified' })
            }
        ]);
        res.status(201).send(response);
    } catch(err) {
        next(err);
    }
}

module.exports.modify = async (req, res, next) => {
    try {
        const { ingredient_id } = req.params;
        const ingredientInfo = await Ingredient.findById(ingredient_id);

        if (!ingredientInfo) {
            throw new AppError(404, 'NOT_FOUND', 'Ingredient does not exist');
        }
        const allowedFields = ingredientInfo.accessibleFieldsBy(req.ability, 'update');
        if (![...Object.keys(req.body), ...(req.file ? [req.file.fieldname] : [])].every(field => allowedFields.includes(field))) {
            throw new CaslError().setMessage('Unauthorized to modify ingredient');
        }
        ingredientInfo.set(req.body);
        if (req.file) {
            const uploadInfo = await s3Operations.createObject(req.file, 'assets/ingredients/images/cover');
            ingredientInfo.cover = uploadInfo.filepath;
        }
        await ingredientInfo.save();
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
        const { ingredient_id } = req.params;
        const ingredientInfo = await Ingredient.findById(ingredient_id);

        if (!ingredientInfo) {
            throw new AppError(404, 'NOT_FOUND', 'Ingredient does not exist');
        }
        CaslError.from(req.ability)
            .setMessage('Unauthorized to delete ingredient')
            .throwUnlessCan('delete', ingredientInfo);

        await ingredientInfo.remove();
        res.status(204).send();
    } catch(err) {
        next(err);
    }
}

module.exports.copy = async (req, res, next) => {
    try {
        const { ingredient_id } = req.params;
        const ingredientInfo = await Ingredient.findById(ingredient_id);

        if (!ingredientInfo) {
            throw new AppError(404, 'NOT_FOUND', 'Ingredient does not exist');
        }
        const allowedFields = ingredientInfo.accessibleFieldsBy(req.ability, 'read');
        const requiredFields = ['name', 'description', 'category', 'sub_category'];
        if (![...requiredFields, 'cover'].every(field => allowedFields.includes(field))) {
            throw new AppError().setMessage('Unauthorized to copy ingredient');
        }
        const createdIngredient = new UserIngredient({
            ...(requiredFields.reduce((accumulator, current) => ({
                ...accumulator,
                [current]: ingredientInfo[current]
            }), {})),
            user: req.user._id
        });
        CaslError.from(req.ability)
            .setMessage('Unauthorized to create ingredient')
            .throwUnlessCan('create', createdIngredient);
        
        if (ingredientInfo.cover) {
            const copyInfo = await s3Operations.copyObject(ingredientInfo.cover);
            createdIngredient.cover = copyInfo.filepath;
        }
        await createdIngredient.save();
        res.status(204).send();
    } catch(err) {
        next(err);
    }
}

module.exports.getIngredient = async (req, res, next) => {
    try {
        const { ingredient_id } = req.params;
        const ingredientInfo = await Ingredient.findById(ingredient_id);

        if (!ingredientInfo) {
            throw new AppError(404, 'NOT_FOUND', 'Ingredient does not exist');
        }
        CaslError.from(req.ability)
            .setMessage('Unauthorized to view ingredient')
            .throwUnlessCan('read', ingredientInfo);

        const response = await responseObject(ingredientInfo, [
            { name: '_id', alias: 'id' },
            { name: 'name' },
            { name: 'description' },
            { name: 'classification_info', parent_fields: [
                { name: 'category' },
                { name: 'sub_category' },
            ] },
            { name: 'cover_url', alias: 'cover' },
            { name: 'verified' },
            {
                name: 'user',
                condition: (document) => document instanceof UserIngredient
            },
            {
                name: 'public',
                condition: (document) => document instanceof UserIngredient
            },
            {
                name: 'date_created',
                ...(ingredientInfo instanceof VerifiedIngredient && { alias: 'date_verified' })
            }
        ], ingredientInfo.accessibleFieldsBy(req.ability, 'read'));
        res.status(200).send(response);
    } catch(err) {
        next(err);
    }
}

module.exports.search = async (req, res, next) => {
    try {
        const { query, page, page_size, ordering, categories } = req.query;
        var searchFilters;
        try {
            searchFilters = await Ingredient.searchFilters(categories);
        } catch(err) {
            throw new AppError(400, 'INVALID_ARGUMENT', err.message, err.errors);
        }

        const searchQuery = Ingredient
            .where({
                name: { $regex: query },
                ...(categories.length && { $and: searchFilters })
            })
            .accessibleBy(req.ability);
        const totalDocuments = await Ingredient.countDocuments(searchQuery);
        const responseDocuments = await Ingredient
            .find(searchQuery)
            .sort(ordering)
            .skip((page - 1) * page_size)
            .limit(page_size)
            .then(documents => Promise.all(documents.map(doc => responseObject(doc, [
                { name: '_id', alias: 'id' },
                { name: 'name' },
                { name: 'classification_info', parent_fields: [
                    { name: 'category' },
                    { name: 'sub_category' },
                ] },
                { name: 'cover_url', alias: 'cover' },
                { name: 'verified' },
                {
                    name: 'user',
                    condition: (document) => document instanceof UserIngredient
                }
            ], doc.accessibleFieldsBy(req.ability, 'read')))));

        const response = {
            page,
            page_size,
            total_pages: Math.ceil(totalDocuments / page_size),
            total_results: totalDocuments,
            data: responseDocuments
        };
        res.status(200).send(response);
    } catch(err) {
        next(err);
    }
}

module.exports.clientIngredients = async (req, res, next) => {
    try {
        const { page, page_size, ordering, categories = [] } = req.query;
        var searchFilters;
        try {
            searchFilters = await Ingredient.searchFilters(categories);
        } catch(err) {
            throw new AppError(400, 'INVALID_ARGUMENT', err.message, err.errors);
        }

        const searchQuery = Ingredient
            .where({
                variant: 'User Ingredient',
                user: req.user._id,
                ...(searchFilters.length && { $or: searchFilters })
            });
        const totalDocuments = await Ingredient.countDocuments(searchQuery);
        const responseDocuments = await Ingredient
            .find(searchQuery)
            .sort(ordering)
            .skip((page - 1) * page_size)
            .limit(page_size)
            .then(documents => Promise.all(documents.map(doc => responseObject(doc, [
                { name: '_id', alias: 'id' },
                { name: 'name' },
                { name: 'classification_info', parent_fields: [
                    { name: 'category' },
                    { name: 'sub_category' },
                ] },
                { name: 'cover_url', alias: 'cover' },
                { name: 'public' },
                { name: 'date_created' }
            ]))));
        const response = {
            page,
            page_size,
            total_pages: Math.ceil(totalDocuments / page_size),
            total_results: totalDocuments,
            data: responseDocuments
        };
        res.status(200).send(response);
    } catch(err) {
        next(err);
    }
}

module.exports.getCategories = async (req, res, next) => {
    try {
        const ingredientCategories = await Ingredient.getCategories();
        res.status(200).send(ingredientCategories);
    } catch(err) {
        next(err);
    }
}
const { subject } = require('@casl/ability');
const { Ingredient, VerifiedIngredient, UserIngredient } = require('../models/ingredient-model');
const FileAccessControl = require('../models/file-access-control-model');
const s3Operations = require('../utils/aws-s3-operations');
const fileOperations = require('../utils/file-operations');
const responseObject = require('../utils/response-object');
const AppError = require('../utils/app-error');

module.exports.create = async (req, res, next) => {
    try {
        const { ingredient_type = 'user' } = req.params;

        if (!req.ability.can('create', subject('ingredients', { subject_type: ingredient_type })))
            throw new AppError(403, 'FORBIDDEN', 'Unauthorized to create Ingredient');
        else if (ingredient_type === 'user' ?
            await UserIngredient.exists({ user: req.user._id, name: req.body.name }) :
            await VerifiedIngredient.exists({ name: req.body.name })   
        )
            throw new AppError(409, 'ALREADY_EXIST', 'An ingredient with that name currently exists');

        const createdIngredient = ingredient_type === 'user' ?
            new UserIngredient({
                ...req.body,
                user: req.user._id
            }) :
            new VerifiedIngredient(req.body);
        await createdIngredient.validate();
        await createdIngredient.save();

        const response = await responseObject(createdIngredient, [
            { name: '_id', alias: 'id' },
            { name: 'name' },
            { name: 'description' },
            { name: 'classificationInfo', alias: 'classification' },
            { name: 'cover_url', alias: 'cover' },
            {
                name: 'public',
                condition: (document) => document instanceof UserIngredient
            },
            {
                name: 'date_created',
                condition: (document) => document instanceof UserIngredient
            },
            {
                name: 'date_verified',
                condition: (document) => document instanceof VerifiedIngredient
            }
        ]);
        res.status(201).send(response);
    } catch(err) {
        next(err);
    }
}

module.exports.update = async (req, res, next) => {
    try {
        const { ingredient_id } = req.params;
        const ingredientInfo = await Ingredient.findOne({ _id: ingredient_id });

        if (!ingredientInfo)
            throw new AppError(404, 'NOT_FOUND', 'Ingredient does not exist');
        else if (!req.ability.can('patch', subject('ingredients', { document: ingredientInfo })))
            throw new AppError(403, 'FORBIDDEN', 'Unauthorized to modify ingredient');
        else if (ingredientInfo instanceof UserIngredient ? 
            await UserIngredient.exists({ user: req.user._id, name: req.body.name, _id: { $ne: ingredient_id } }) :
            await VerifiedIngredient.exists({ name: req.body.name, _id: { $ne: ingredient_id } })
        )
            throw new AppError(409, 'ALREADY_EXIST', 'An ingredient with that name currently exists');
        
        ingredientInfo.set(req.body);
        await ingredientInfo.validate();
        await ingredientInfo.save();

        res.status(204).send();
    } catch(err) {
        next(err);
    }
}

module.exports.delete = async (req, res, next) => {
    try {
        const { ingredient_id } = req.params;
        const ingredientInfo = await Ingredient.findOne({ _id: ingredient_id });

        if (!ingredientInfo)
            throw new AppError(404, 'NOT_FOUND', 'Ingredient does not exist');
        else if (!req.ability.can('delete', subject('ingredients', { document: ingredientInfo })))
            throw new AppError(403, 'FORBIDDEN', 'Unauthorized to modify ingredient cover image');

        if (ingredientInfo.cover) {
            const aclDocument = await FileAccessControl.findOne({ _id: ingredientInfo.cover });
            if (!aclDocument.authorize('delete', { user: req.user }))
                throw new AppError(403, 'FORBIDDEN', 'Unauthorized to modify ingredient cover image');

            await s3Operations.removeObject(aclDocument.file_path);
            await aclDocument.remove();
        }
        await ingredientInfo.remove();
        res.status(204).send();
    } catch(err) {
        next(err);
    }
}

module.exports.updatePrivacy = async (req, res, next) => {
    try {
        const { ingredient_id } = req.params;
        const ingredientInfo = await Ingredient.findOne({ _id: ingredient_id });

        if (!ingredientInfo)
            throw new AppError(404, 'NOT_FOUND', 'Ingredient does not exist');
        else if (!ingredientInfo instanceof UserIngredient)
            throw new AppError(400, 'INVALID_ARGUMENT', 'Privacy change is only allowed on non-verified ingredients');
        else if(!req.ability.can('patch', subject('ingredients', ingredientInfo)))
            throw new AppError(403, 'FORBIDDEN', 'Unauthorized to modify ingredient');

        ingredientInfo.public = !ingredientInfo.public;
        if (ingredientInfo.cover) {
            const aclDocument = await FileAccessControl.findOne({ _id: ingredientInfo.cover });
            if (!aclDocument.authorize('update', { user: req.user }))
                throw new AppError(403, 'FORBIDDEN', 'Unauthorized to modify ingredient cover image');

            aclDocument.permissions = [
                { action: 'manage', conditions: { 'user._id': req.user._id } },
                ...(ingredientInfo.public ? { action: 'read' } : {})
            ];
            await aclDocument.save();
        }
        await ingredientInfo.save();
        res.status(200).send(ingredientInfo);
    } catch(err) {
        next(err);
    }
}

module.exports.uploadCover = async (req, res, next) => {
    try {
        const { ingredient_id } = req.params;
        const ingredientCover = req.file;

        if (!ingredientCover)
            throw new AppError(400, 'MISSING_REQUIRED_FILE', 'No image was uploaded');

        const ingredientInfo = await Ingredient.findOne({ _id: ingredient_id });
        if (!ingredientInfo)
            throw new AppError(404, 'NOT_FOUND', 'Ingredient does not exist');
        else if (!req.ability.can('patch', subject('ingredients', { document: ingredientInfo })))
            throw new AppError(403, 'FORBIDDEN', 'Unauthorized to modify ingredient');

        if (ingredientInfo.cover) {
            const aclDocument = await FileAccessControl.findOne({ _id: ingredientInfo.cover });
            if (!aclDocument.authorize('update', { user: req.user }))
                throw new AppError(403, 'FORBIDDEN', 'Unauthorized to modify ingredient cover image');

            const [,uploadInfo] = await Promise.all([
                s3Operations.removeObject(aclDocument.file_path),
                s3Operations.createObject(ingredientCover, 'assets/ingredients/images')
            ]);

            aclDocument.set({
                file_name: uploadInfo.filename,
                file_size: ingredientCover.size,
                mime_type: ingredientCover.mimetype,
                file_path: uploadInfo.filepath
            });
            await aclDocument.save();
        } else {
            const uploadInfo = await s3Operations.createObject(ingredientCover, 'assets/ingredients/images');
            const createdACL = new FileAccessControl({
                file_name: uploadInfo.filename,
                file_size: ingredientCover.size,
                mime_type: ingredientCover.mimetype,
                file_path: uploadInfo.filepath,
                permissions: (ingredientInfo instanceof UserIngredient ?
                    [
                        { action: 'manage', condition: { 'user._id': req.user._id } },
                        ...(ingredientInfo.public ? { action: 'read' } : {})
                    ] : [
                        { action: 'read' },
                        { action: 'manage', conditions: { 'user.role': 'admin' } },
                        { action: 'manage', conditions: { 'user.role': 'editor' } }
                    ]
                )
            });
            await createdACL.save();
            ingredientInfo.cover = createdACL._id;
        }
        await ingredientInfo.save();
        res.status(204).send();
    } catch(err) {
        next(err);
    } finally {
        try {
            await fileOperations.deleteSingle(req.file.path);
        } catch(err) {
            console.error(err);
        }
    }
}

module.exports.deleteCover = async (req, res, next) => {
    try {
        const { ingredient_id } = req.params;
        const ingredientInfo = await Ingredient.findOne({ _id: ingredient_id });

        if (!ingredientInfo)
            throw new AppError(404, 'NOT_FOUND', 'Ingredient does not exist');
        else if (!req.ability.can('patch', subject('ingredients', { document: ingredientInfo })))
            throw new AppError(403, 'FORBIDDEN', 'Unauthorized to modify ingredient');
        else if (!ingredientInfo.cover)
            throw new AppError(400, 'INVALID_ARGUMENT', 'Ingredient does not have a cover image');

        const aclDocument = await FileAccessControl.findOne({ _id: ingredientInfo.cover });
        if (!aclDocument.authorize('delete', { user: req.user }))
            throw new AppError(404, 'FORBIDDEN', 'Unauthorized to modify ingredient cover image');
        
        await s3Operations.removeObject(aclDocument.file_path);
        await aclDocument.remove();

        ingredientInfo.cover = null;
        await ingredientInfo.save();

        res.status(204).send();
    } catch(err) {
        next(err);
    }
}

module.exports.copy = async (req, res, next) => {
    try {
        const { ingredient_id } = req.params;
        const ingredientInfo = await Ingredient.findOne({ _id: ingredient_id });
        
        if (!ingredientInfo)
            throw new AppError(404, 'NOT_FOUND', 'Ingredient does not exist');
        else if (
            !req.ability.can('read', subject('ingredients', { action_type: 'public', document: ingredientInfo })) ||
            !req.ability.can('create', subject('ingredients', { subject_type: 'user' }))
        )
            throw new AppError(403, 'FORBIDDEN', 'Unauthorized request');
        else if (await UserIngredient.exists({ user: req.user._id, name: ingredientInfo.name }))
            throw new AppError(409, 'ALREADY_EXIST', 'Name already associated with an ingredient');

        const { name, description, classification } = ingredientInfo;
        const createdIngredient = new UserIngredient({
            name,
            description,
            classification,
            user: req.user._id
        });

        if (ingredientInfo.cover) {
            const aclDocument = await FileAccessControl.findOne({ _id: ingredientInfo.cover });
            if (!aclDocument.authorize('read', { user: req.user }))
                throw new AppError(403, 'FORBIDDEN', 'Unauthorized to view ingredient cover image');

            const copyInfo = await s3Operations.copyObject(aclDocument.file_path);
            const createdACL = FileAccessControl({
                file_name: copyInfo.filename,
                file_size: aclDocument.file_size,
                mime_type: aclDocument.mime_type,
                file_path: copyInfo.filepath,
                permissions: [
                    { action: 'manage', conditions: { 'user._id': req.user._id } }
                ]
            });
            await createdACL.save();
            ingredientInfo.cover = createdACL._id;
        }
        await createdIngredient.save();
        res.status(204).send();
    } catch(err) {
        next(err);
    }
}

module.exports.getIngredient = async (req, res, next) => {
    try {
        const { ingredient_id, privacy_type = 'public' } = req.params;
        const ingredientInfo = await Ingredient
            .findOne({ _id: ingredient_id });

        if (!ingredientInfo)
            throw new AppError(404, 'NOT_FOUND', 'Ingredient does not exist');
        else if (!req.ability.can('read', subject('ingredients', { action_type: privacy_type, document: ingredientInfo })))
            throw new AppError(403, 'FORBIDDEN', 'Unauthorized to view ingredient');

        const response = await responseObject(ingredientInfo, [
            { name: '_id', alias: 'id' },
            { name: 'name' },
            { name: 'description' },
            { name: 'classificationInfo', alias: 'classification' },
            { name: 'cover_url', alias: 'cover' },
            { name: 'verified' },
            {
                name: 'user',
                condition: (document) => document instanceof UserIngredient
            },
            {
                name: 'date_created',
                condition: (document) => privacy_type === 'private' && document instanceof UserIngredient
            },
            {
                name: 'date_verified',
                condition: (document) => privacy_type === 'private' && document instanceof VerifiedIngredient
            }
        ]);
        res.status(200).send(response);
    } catch(err) {
        next(err);
    }
}

module.exports.search = async (req, res, next) => {
    try {
        const { query, page, page_size, ordering, category_filter } = req.query;
        const categoryFilterValidations = await Promise.all(category_filter.map(({ category_id, sub_category_ids }) => {
            return Ingredient.validateCategory(category_id, sub_category_ids);
        }));
        const invalidCategoryFilters = categoryFilterValidations.reduce((accumulator, { isValid, reason, errors }, index) => {
            return [
                ...accumulator,
                ...(!isValid ? [{
                    category_id: category_filter[index].category_id,
                    reason,
                    ...(reason === 'invalid_sub_categories' ? {
                        errors: errors.map(subId => {
                            return {
                                sub_category_id: subId,
                                message: 'Invalid sub-category value'
                            }
                        })
                    } : {
                        message: 'Invalid category value'
                    })
                }] : [])
            ];
        }, []);
        if (invalidCategoryFilters.length)
            throw new AppError(400, 'INVALID_ARGUMENT', 'Invalid category filter parameters', invalidCategoryFilters);

        const searchQuery = Ingredient
            .where({ name: { $regex: query } })
            .or(req.user ? [
                { model: 'Verified Ingredient' },
                { user: req.user._id },
                { public: true }
            ] : [
                { model: 'Verified Ingredient' },
                { public: true }
            ])
            .categoryFilter(category_filter);
        
        const totalDocuments = await Ingredient.countDocuments(searchQuery);
        const responseDocuments = await Ingredient
            .find(searchQuery)
            .sort(ordering)
            .skip((page - 1) * page_size)
            .limit(page_size)
            .then(documents => Promise.all(documents.map(doc => responseObject(doc, [
                { name: '_id', alias: 'id' },
                { name: 'name' },
                { name: 'description' },
                { name: 'classificationInfo', alias: 'classification' },
                { name: 'cover_url', alias: 'cover' },
                { name: 'verified' }
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

module.exports.clientIngredients = async (req, res, next) => {
    try {
        const { page, page_size, ordering, category_filter } = req.query;
        const categoryFilterValidations = await Promise.all(category_filter.map(({ category_id, sub_category_ids }) => {
            return Ingredient.validateCategory(category_id, sub_category_ids);
        }));
        const invalidCategoryFilters = categoryFilterValidations.reduce((accumulator, { isValid, reason, errors }, index) => {
            return [
                ...accumulator,
                ...(!isValid ? [{
                    category_id: category_filter[index].category_id,
                    reason,
                    ...(reason === 'invalid_sub_categories' ? {
                        errors: errors.map(subId => {
                            return {
                                sub_category_id: subId,
                                message: 'Invalid sub-category value'
                            }
                        })
                    } : {
                        message: 'Invalid category value'
                    })
                }] : [])
            ];
        }, []);
        if (invalidCategoryFilters.length)
            throw new AppError(400, 'INVALID_ARGUMENT', 'Invalid category filter parameters', invalidCategoryFilters);

        const searchQuery = Ingredient
            .find({ user: req.user._id })
            .categoryFilter(category_filter);

        const totalDocuments = await Ingredient.countDocuments(searchQuery);
        const responseDocuments = await Ingredient
            .find(searchQuery)
            .sort(ordering)
            .skip((page - 1) * page_size)
            .limit(page_size)
            .then(documents => Promise.all(documents.map(doc => responseObject(doc, [
                { name: '_id', alias: 'id' },
                { name: 'name' },
                { name: 'description' },
                { name: 'classificationInfo', alias: 'classification' },
                { name: 'cover_url', alias: 'cover' },
                { name: 'verified' }
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
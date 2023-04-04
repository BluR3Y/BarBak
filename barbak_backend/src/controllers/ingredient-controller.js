const { subject } = require('@casl/ability');
const { Ingredient, VerifiedIngredient, UserIngredient } = require('../models/ingredient-model');
const { AppAccessControl } = require('../models/access-control-model');
const s3Operations = require('../utils/aws-s3-operations');
const fileOperations = require('../utils/file-operations');
const responseObject = require('../utils/response-object');

module.exports.create = async (req, res) => {
    try {
        const { ingredient_type = 'user' } = req.params;
        const { name, description, category, sub_category } = req.body;
        
        if (!req.ability.can('create', subject('ingredients', { subject_type: ingredient_type })))
            return res.status(403).send({ path: 'verified', type: 'valid', message: 'Unauthorized to create ingredient' });
        else if (ingredient_type === 'user' ?
            await UserIngredient.exists({ user: req.user._id, name }) :
            await VerifiedIngredient.exists({ name })   
        )
            return res.status(400).send({ path: 'name', type: 'exist', message: 'An ingredient with that name currently exists' });
        
        const createdIngredient = ingredient_type === 'user' ? new UserIngredient({
            name,
            description,
            category,
            sub_category,
            user: req.user._id
        }) : new VerifiedIngredient({
            name,
            description,
            category,
            sub_category
        });
        await createdIngredient.validate();
        await createdIngredient.customValidate();
        await createdIngredient.save();

        const responseFields = [
            { name: '_id', alias: 'id' },
            { name: 'name' },
            { name: 'description' },
            { name: 'category' },
            { name: 'sub_category' },
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
        ];
        res.status(201).send(responseObject(createdIngredient, responseFields));
    } catch(err) {
        if (err.name === 'ValidationError' || err.name === 'CustomValidationError')
            return res.status(400).send(err);
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

module.exports.update = async (req, res) => {
    try {
        const { name, description, category, sub_category } = req.body;
        const { ingredient_id } = req.params;
        const ingredientInfo = await Ingredient.findOne({ _id: ingredient_id });

        if (!ingredientInfo)
            return res.status(404).send({ path: 'ingredient_id', type: 'exist', message: 'Ingredient does not exist' });
        else if (!req.ability.can('patch', subject('ingredients', { document: ingredientInfo })))
            return res.status(403).send({ path: 'ingredient_id', type: 'valid', message: 'Unauthorized request' });
        else if (ingredientInfo instanceof UserIngredient ? 
            await UserIngredient.exists({ user: req.user._id, name, _id: { $ne: ingredient_id } }) :
            await VerifiedIngredient.exists({ name, _id: { $ne: ingredient_id } })
        )
            return res.status(400).send({ path: 'name', type: 'exist', message: 'An ingredient with that name currently exists' });
        
        ingredientInfo.set({
            name,
            description,
            category,
            sub_category
        });

        await ingredientInfo.validate();
        await ingredientInfo.customValidate();
        await ingredientInfo.save();

        res.status(204).send();
    } catch(err) {
        if (err.name === 'ValidationError' || err.name === 'CustomValidationError')
            return res.status(400).send(err);
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

module.exports.delete = async (req, res) => {
    try {
        const { ingredient_id } = req.params;
        const ingredientInfo = await Ingredient.findOne({ _id: ingredient_id });

        if (!ingredientInfo)
            return res.status(404).send({ path: 'ingredient_id', type: 'exist', message: 'Ingredient does not exist' });
        else if (!req.ability.can('delete', subject('ingredients', { document: ingredientInfo })))
            return res.status(403).send({ path: 'ingredient_id', type: 'valid', message: 'Unauthorized request' });
        
        if (ingredientInfo instanceof UserIngredient && ingredientInfo.cover_acl) {
            const aclDocument = await AppAccessControl.findOne({ _id: ingredientInfo.cover_acl });
            await s3Operations.removeObject(aclDocument.file_path);
            await aclDocument.remove();
        } else if (ingredientInfo instanceof VerifiedIngredient && ingredientInfo.cover)
            await s3Operations.removeObject(ingredientInfo.cover);

        await ingredientInfo.remove();

        res.status(204).send();
    } catch(err) {
        console.error(err);
        res.status(500).send('Internal server error');
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
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

module.exports.uploadCover = async (req, res) => {
    try {
        const { ingredient_id } = req.params;
        const ingredientCover = req.file;

        if (!ingredientCover)
            return res.status(400).send({ path: 'image', type: 'exist', message: 'No image was uploaded' });

        const ingredientInfo = await Ingredient.findOne({ _id: ingredient_id });
        if (!ingredientInfo)
            return res.status(404).send({ path: 'ingredient_id', type: 'exist', message: 'Ingredient does not exist' });
        else if (!req.ability.can('patch', subject('ingredients', { document: ingredientInfo })))
            return res.status(403).send({ path: 'ingredient_id', type: 'valid', message: 'Unauthorized request' });

        const uploadInfo = await s3Operations.createObject(ingredientCover, `assets/${ingredientInfo instanceof UserIngredient ? 'private' : 'public'}/images`);
        if (ingredientInfo instanceof UserIngredient) {
            if (ingredientInfo.cover_acl) {
                const aclDocument = await AppAccessControl.findOne({ _id: ingredientInfo.cover_acl });
                await s3Operations.removeObject(aclDocument.file_path);

                aclDocument.set({
                    file_name: uploadInfo.filename,
                    file_size: ingredientCover.size,
                    mime_type: ingredientCover.mimetype,
                    file_path: uploadInfo.filepath
                });
                await aclDocument.save();
            } else {
                const createdACL = new AppAccessControl({
                    file_name: uploadInfo.filename,
                    file_size: ingredientCover.size,
                    mime_type: ingredientCover.mimetype,
                    file_path: uploadInfo.filepath,
                    user: req.user._id,
                    referenced_document: ingredientInfo._id,
                    referenced_model: 'Ingredient'
                });
                await createdACL.save();
                ingredientInfo.cover_acl = createdACL._id;
            }
        } else {
            if (ingredientInfo.cover)
                await s3Operations.removeObject(ingredientInfo.cover);
            ingredientInfo.cover = uploadInfo.filepath;
        }
        await ingredientInfo.save();

        res.status(204).send();
    } catch(err) {
        console.error(err);
        res.status(500).send('Internal server error');
    } finally {
        if (req.file)
            await fileOperations.deleteSingle(req.file.path)
            .catch(err => console.error(err));
    }
}

module.exports.deleteCover = async (req, res) => {
    try {
        const { ingredient_id } = req.params;
        const ingredientInfo = await Ingredient.findOne({ _id: ingredient_id });

        if (!ingredientInfo)
            return res.status(404).send({ path: 'ingredient_id', type: 'exist', message: 'Ingredient does not exist' });
        else if (!req.ability.can('patch', subject('ingredients', { document: ingredientInfo })))
            return res.status(403).send({ path: 'ingredient_id', type: 'valid', message: 'Unauthorized request' });
        else if (ingredientInfo instanceof UserIngredient ?
            !ingredientInfo.cover_acl :
            !ingredientInfo.cover
        )
            return res.status(404).send({ path: 'image', type: 'exist', message: 'Ingredient does not have a cover image' });

        if (ingredientInfo instanceof UserIngredient) {
            const aclDocument = await AppAccessControl.findOne({ _id: ingredientInfo.cover_acl });
            await s3Operations.removeObject(aclDocument.file_path);
            await aclDocument.remove();
            ingredientInfo.cover_acl = null;
        } else {
            await s3Operations.removeObject(ingredientInfo.cover);
            ingredientInfo.cover = null;
        }
        await ingredientInfo.save();

        res.status(204).send();
    } catch(err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

module.exports.copy = async (req, res) => {
    try {
        const { ingredient_id } = req.params;
        const ingredientInfo = await Ingredient.findOne({ _id: ingredient_id });
        
        if (!ingredientInfo)
            return res.status(404).send({ path: 'ingredient_id', type: 'exist', message: 'Ingredient does not exist' });
        else if (
            !req.ability.can('read', subject('ingredients', { action_type: 'public', document: ingredientInfo })) ||
            !req.ability.can('create', subject('ingredients', { subject_type: 'user' }))
        )
            return res.status(403).send({ path: 'ingredient_id', type: 'valid', message: 'Unauthorized request' });
        else if (await UserIngredient.exists({ user: req.user._id, name: ingredientInfo.name }))
            return res.status(400).send({ path: 'name', type: 'exist', message: 'An ingredient with that name currently exists' });
        
        const { name, description, category, sub_category } = ingredientInfo;
        const createdIngredient = new UserIngredient({
            name,
            description,
            category,
            sub_category,
            user: req.user._id
        });

        if (ingredientInfo instanceof UserIngredient && ingredientInfo.cover_acl) {
            const aclDocument = await AppAccessControl.findOne({ _id: ingredientInfo.cover_acl });
            const copyInfo = await s3Operations.copyObject(aclDocument.file_path);
            const createdACL = new AppAccessControl({
                file_name: copyInfo.filename,
                file_size: aclDocument.file_size,
                mime_type: aclDocument.mime_type,
                file_path: copyInfo.filepath,
                user: req.user._id,
                referenced_document: createdIngredient._id,
                referenced_model: 'Ingredient'
            });
            await createdACL.save();
            createdIngredient.cover_acl = createdACL._id;
        } else if (ingredientInfo instanceof VerifiedIngredient && ingredientInfo.cover) {
            const copyInfo = await s3Operations.copyObject(ingredientInfo.cover);
            const copyMetadata = await s3Operations.objectMetadata(copyInfo.filepath);
            const createdACL = new AppAccessControl({
                file_name: copyInfo.filename,
                file_size: copyMetadata.ContentLength,
                mime_type: copyMetadata.ContentType,
                file_path: copyInfo.filepath,
                user: req.user._id,
                referenced_document: createdIngredient._id,
                referenced_model: 'Ingredient'
            });
            await createdACL.save();
            createdIngredient.cover_acl = createdACL._id;
        }
        await createdIngredient.save();

        res.status(204).send();
    } catch(err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

module.exports.getIngredient = async (req, res) => {
    try {
        const { ingredient_id, privacy_type = 'public' } = req.params;
        const ingredientInfo = await Ingredient.findOne({ _id: ingredient_id });

        if (!ingredientInfo)
            return res.status(404).send({ path: 'ingredient_id', type: 'exist', message: 'Ingredient does not exist' });
        else if (!req.ability.can('read', subject('ingredients', { action_type: privacy_type, document: ingredientInfo })))
            return res.status(403).send({ path: 'ingredient_id', type: 'valid', message: 'Unauthorized request' });

        const responseFields = [
            { name: '_id', alias: 'id' },
            { name: 'name' },
            { name: 'description' },
            { name: 'category' },
            { name: 'sub_category' },
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
        ];
        res.status(200).send(responseObject( ingredientInfo, responseFields));
    } catch(err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

module.exports.search = async (req, res) => {
    try {
        const { query, page, page_size, ordering, category_filter } = req.query;
        const { isValid, errors } = await Ingredient.validateCategories(category_filter);

        if (!isValid)
            return res.status(400).send({ category_filter: errors });

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
            .then(documents => documents.map(doc => responseObject(doc, [
                { name: '_id', alias: 'id' },
                { name: 'name' },
                { name: 'category' },
                { name: 'sub_category' },
                { name: 'cover_url', alias: 'cover' },
                { name: 'verified' }
            ])));

        const response = {
            page,
            page_size,
            total_pages: Math.ceil(totalDocuments / page_size),
            total_results: totalDocuments,
            data: responseDocuments
        };
        res.status(200).send(response);
    } catch(err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

module.exports.clientIngredients = async (req, res) => {
    try {
        const { page, page_size, ordering, category_filter } = req.query;
        const { isValid, errors } = await Ingredient.validateCategories(category_filter);

        if (!isValid)
            return res.status(400).send({ category_filter: errors });

        const searchQuery = Ingredient
            .find({ user: req.user._id })
            .categoryFilter(category_filter);

        const totalDocuments = await Ingredient.countDocuments(searchQuery);
        const responseDocuments = await Ingredient
            .find(searchQuery)
            .sort(ordering)
            .skip((page - 1) * page_size)
            .limit(page_size)
            .then(documents => documents.map(doc => responseObject(doc, [
                { name: '_id', alias: 'id' },
                { name: 'name' },
                { name: 'category' },
                { name: 'sub_category' },
                { name: 'cover_url', alias: 'cover' },
                { name: 'public' },
                { name: 'date_created' }
            ])));

        const response = {
            page,
            page_size,
            total_pages: Math.ceil(totalDocuments / page_size),
            total_results: totalDocuments,
            data: responseDocuments
        };
        res.status(200).send(response);
    } catch(err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
}
const { subject } = require('@casl/ability');
const { Drink, VerifiedDrink, UserDrink } = require('../models/drink-model');
const FileAccessControl = require('../models/file-access-control-model');
const responseObject = require('../utils/response-object');
const fileOperations = require('../utils/file-operations');
const s3Operations = require('../utils/aws-s3-operations');
const AppError = require('../utils/app-error');

module.exports.create = async (req, res, next) => {
    try {
        const { drink_type = 'user' } = req.params;
        if (!req.ability.can('create', subject('drinks', { subject_type: drink_type })))
            throw new AppError(403, 'FORBIDDEN', 'Unauthorized to create drink');
        else if (drink_type === 'user' ?
            await UserDrink.exists({ user: req.user._id, name: req.body.name }) :
            await VerifiedDrink.exists({ name: req.body.name })
        )
            throw new AppError(409, 'ALREADY_EXIST', 'A drink with that name currently exists');
        
        const createdDrink = drink_type === 'user' ?
            new UserDrink({
                ...req.body,
                user: req.user._id
            }) :
            new VerifiedDrink(req.body);
        await createdDrink.validate();
        await createdDrink.save();

        const response = await responseObject(createdDrink, [
            { name: '_id', alias: 'id' },
            { name: 'name' },
            { name: 'preparation_method' },
            { name: 'verified' },
            { name: 'cover_url', alias: 'cover' }
        ]);
        res.status(200).send(response);
    } catch(err) {
        next(err);
    }
}

module.exports.update = async (req, res, next) => {
    try {
        const { drink_id } = req.params;
        const drinkInfo = await Drink.findOne({ _id: drink_id });

        if (!drinkInfo)
            throw new AppError(404, 'NOT_FOUND', 'Drink does not exist');
        else if (!req.ability.can('update', subject('drinks', { document: drinkInfo })))
            throw new AppError(403, 'FORBIDDEN', 'Unauthorized to modify drink');
        else if (drinkInfo instanceof UserDrink ?
            await UserDrink.exists({ user: req.user._id, name: req.body.name, _id: { $ne: drink_id } }) :
            await VerifiedDrink.exists({ name: req.body.name, _id: { $ne: drink_id } })
        )
            throw new AppError(409, 'ALREADY_EXIST', 'A drink with that name currently exists');

        drinkInfo.set(req.body);
        await drinkInfo.validate();
        await drinkInfo.save();

        res.status(204).send();
    } catch(err) {
        next(err);
    }
}

module.exports.delete = async (req, res, next) => {
    try {
        const { drink_id } = req.params;
        const drinkInfo = await Drink.findOne({ _id: drink_id });

        if (!drinkInfo)
            throw new AppError(404, 'NOT_FOUND', 'Drink does not exist');
        else if (!req.ability.can('delete', subject('drinks', { document: drinkInfo })))
            throw new AppError(403, 'FORBIDDEN', 'Unauthorized to modify drink');

        const { assets } = drinkInfo;
        if (assets.gallery.length) {
            const galleryACLDocuments = await Promise.all(assets.gallery.map(imageACL => {
                return FileAccessControl.findOne({ _id: imageACL });
            }));
            if (galleryACLDocuments.some(aclDocument => !aclDocument.authorize('delete', { user: req.user })))
                throw new AppError(403, 'FORBIDDEN', 'Drink contains images you are not authorized to remove');

            await Promise.all(galleryACLDocuments.map(async aclDocument => {
                await s3Operations.removeObject(aclDocument.file_path);
                await aclDocument.remove();
            }));
        }
        await drinkInfo.remove();
        res.status(204).send();
    } catch(err) {
        next(err);
    }
}

module.exports.updatePrivacy = async (req, res, next) => {
    try {
        const { drink_id } = req.params;
        const drinkInfo = await Drink.findOne({ _id: drink_id });

        if (!drinkInfo)
            throw new AppError(404, 'NOT_FOUND', 'Drink does not exist');
        else if (!drinkInfo instanceof UserDrink)
            throw new AppError(400, 'INVALID_ARGUMENT', 'Privacy change is only allowed on non-verified drinks');
        else if (!req.ability.can('patch', subject('drinks', { document: drinkInfo })))
            throw new AppError(403, 'FORBIDDEN', 'Unauthorized to modify drink');

        drinkInfo.public = !drinkInfo.public;
        const { assets } = drinkInfo;
        if (assets.gallery.length) {
            const galleryACLDocuments = await Promise.all(assets.gallery.map(imageACL => {
                return FileAccessControl.findOne({ _id: imageACL });
            }));
            if (galleryACLDocuments.some(aclDocument => !aclDocument.authorize('update', { user: req.user })))
                throw new AppError(403, 'FORBIDDEN', 'Drink contains images you are not authorized to modify');
            
            await Promise.all(galleryACLDocuments.map(async aclDocument => {
                aclDocument.permissions = [
                    { action: 'manage', conditions: { 'user._id': req.user._id } },
                    ...(drinkInfo.public ? [{ action: 'read' }] : [])
                ];
                await aclDocument.save();
            }));
        }
        await drinkInfo.save();
        res.status(204).send();
    } catch(err) {
        next(err);
    }
}

module.exports.uploadGallery = async (req, res, next) => {
    try {
        const { drink_id } = req.params;
        const galleryUploads = req.files;

        if (!galleryUploads)
            throw new AppError(400, 'MISSING_REQUIRED_FILE', 'No images were uploaded');

        const drinkInfo = await Drink.findOne({ _id: drink_id });
        if (!drinkInfo)
            throw new AppError(404, 'NOT_FOUND', 'Drink does not exist');
        else if (!req.ability.can('patch', subject('drinks', { document: drinkInfo })))
            throw new AppError(403, 'FORBIDDEN', 'Unauthorized to modify drink');
        else if (galleryUploads.length + drinkInfo.assets.gallery.length > 10)
            throw new AppError(409, 'CONFLICT', 'Adding uploads to drink gallery exceeds limit');   // correct code

        const uploadInfo = await Promise.all(galleryUploads.map(async galleryImage => {
            const imageUpload = await s3Operations.createObject(galleryImage, 'assets/drinks/images');
            const createdACL = new FileAccessControl({
                file_name: imageUpload.filename,
                file_size: galleryImage.size,
                mime_type: galleryImage.mimetype,
                file_path: imageUpload.filepath,
                permissions: (drinkInfo instanceof UserDrink ?
                    [
                        { action: 'manage', condition: { 'user._id': req.user._id } },
                        ...(drinkInfo.public ? [{ action: 'read' }] : [])
                    ] : [
                        { action: 'read' },
                        { action: 'manage', conditions: { 'user.role': 'admin' } },
                        { action: 'manage', conditions: { 'user.role': 'editor' } }
                    ]
                )
            });
            await createdACL.save();
            return createdACL;
        }));
        drinkInfo.assets.gallery = [
            ...drinkInfo.assets.gallery, 
            ...(uploadInfo.map(uploadStats => uploadStats._id))
        ];
        await drinkInfo.save();
        res.status(204).send();
    } catch(err) {
        next(err);
    } finally {
        Promise.all(req.files.map(upload => fileOperations.deleteSingle(upload.path)))
        .catch(err => console.error(err));
    }
}

module.exports.removeGallery = async (req, res) => {
    // try {
    //     const { drink_id } = req.params;
    //     const drinkInfo = await Drink.findOne({ _id: drink_id });

    //     if (!drinkInfo)
    //         return res.status(404).send({ path: 'drink_id', type: 'exist', message: 'Drink does not exist' });
    //     else if (!req.ability.can('patch', subject('drinks', { document: drinkInfo })))
    //         return res.status(403).send({ path: 'drink_id', type: 'valid', message: 'Unauthorized request' });

    //     const selectedImages = req.body.gallery_ids;
    //     const selectedImagesACL = await Promise.allSettled(selectedImages.map(async (image_id) => {
    //         if (!drinkInfo.assets.gallery.includes(image_id))
    //             throw { key: image_id, type: 'exist', message: 'Image does not exist in gallery' };
            
    //         const aclDocument = await FileAccessControl.findOne({ _id: image_id });
    //         if (!aclDocument)
    //             throw { key: image_id, type: 'exist', message: 'Image was not found' };
    //         else if (!aclDocument.authorize('delete', { user: req.user }))
    //             throw { key: image_id, type: 'valid', message: 'Unauthorized to modify image' };

    //         return aclDocument;
    //     }));

    //     const rejectedOperations = selectedImagesACL
    //         .filter(image_acl => image_acl.status === 'rejected')
    //         .map(image_acl => image_acl.reason)
    //         .reduce((accumulator, current) => {
    //             accumulator[current.key] = {
    //                 type: current.type,
    //                 message: current.message
    //             };
    //             return accumulator;
    //         }, {});
    //     if (Object.keys(rejectedOperations).length)
    //         return res.status(400).send({ path: 'gallery_ids', errors: rejectedOperations });

    //     await Promise.all(selectedImagesACL.map(async ({value}) => {
    //         const imageIndex = drinkInfo.assets.gallery.indexOf(value._id);
    //         await s3Operations.removeObject(value.file_path);
    //         await value.remove();
    //         drinkInfo.assets.gallery.splice(imageIndex, 1);
    //     }));
    //     await drinkInfo.save();
    //     res.status(204).send();
    // } catch(err) {
    //     console.error(err);
    //     res.status(500).send('Internal server error');
    // }
    // Last Here
}

module.exports.copy = async (req, res) => {
    try {
        const { drink_id } = req.params;
        const drinkInfo = await Drink.findOne({ _id: drink_id });

        if (!drinkInfo)
            return res.status(404).send({ path: 'drink_id', type: 'exist', message: 'Drink does not exist' });
        else if (
            !req.ability.can('read', subject('drinks', { action_type: 'public', document: drinkInfo })) ||
            !req.ability.can('create', subject('drinks', { subject_type: 'user' }))
        )
            return res.status(403).send({ path: 'drink_id', type: 'valid', message: 'Unauthorized request' });
        else if (await UserDrink.exists({ user: req.user._id, name: drinkInfo.name }))
            return res.status(400).send({ path: 'name', type: 'exist', message: 'A drink with that name currently exists' });

        const createdDrink = new UserDrink({
            name: drinkInfo.name,
            description: drinkInfo.description,
            preparation_method: drinkInfo.preparation_method,
            serving_style: drinkInfo.serving_style,
            drinkware: drinkInfo.drinkware,
            preparation: drinkInfo.preparation,
            ingredients: drinkInfo.ingredients,
            tools: drinkInfo.tools,
            tags: drinkInfo.tags,
            assets: drinkInfo.assets,
            user: req.user._id
        });

        if (drinkInfo.assets.gallery.length) {
            const galleryACLDocuments = await Promise.allSettled(drinkInfo.assets.gallery.map(async (imageACL, index) => {
                const aclDocument = await FileAccessControl.findOne({ _id: imageACL });
                if (!aclDocument) {
                    throw ({
                        path: index,
                        type: 'exist',
                        message: 'Image not found'
                    });
                } else if (!aclDocument.authorize('update', { user: req.user })) {
                    throw ({
                        path: index,
                        type: 'valid',
                        message: 'Unauthorized to delete image'
                    });
                } else
                    return aclDocument;
            }));
            
            const rejectedOperations = galleryACLDocuments.filter(aclDocument => aclDocument.status === 'rejected');
            if (rejectedOperations.length) {
                const rejectedError = {};
                for (const err of rejectedOperations)
                    rejectedError[err.reason.path] = { type: err.reason.type, message: err.reason.message };
                return res.status(400).send({ gallery: rejectedError });
            }

            const galleryUploadInfo = await Promise.all(galleryACLDocuments.map(async ({value}) => {
                const copyInfo = await s3Operations.copyObject(value.file_path);
                const createdACL = FileAccessControl({
                    file_name: copyInfo.filename,
                    file_size: value.file_size,
                    mime_type: value.mime_type,
                    file_path: copyInfo.filepath,
                    permissions: [
                        { action: 'manage', conditions: { 'user._id': req.user._id } }
                    ]
                });
                await createdACL.save();
                return createdACL;
            }));
            drinkInfo.assets.gallery = galleryUploadInfo.map(uploadInfo => uploadInfo._id);
        }
        await createdDrink.save();
        res.status(204).send();
    } catch(err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

module.exports.getDrink = async (req, res) => {
    try {
        const { drink_id, privacy_type = 'public' } = req.params;
        const drinkInfo = await Drink
            .findOne({ _id: drink_id })
            .populate([
                { path: 'ingredients.ingredient_id' },
                { path: 'drinkwareInfo' },
                { path: 'toolInfo' }
            ]);

        if (!drinkInfo) 
            return res.status(404).send({ path: 'drink_id', type: 'exist', message: 'Drink does not exist' });
        else if (!req.ability.can('read', subject('drinks', { action_type: privacy_type, document: drinkInfo })))
            return res.status(403).send({ path: 'drink_id', type: 'valid', message: 'Unauthorized request' });

        const responseFields = [
            { name: '_id', alias: 'id' },
            { name: 'name' },
            { name: 'description' },
            { name: 'preparation_method' },
            { name: 'serving_style' },
            { name: 'preparation' },
            { name: 'ingredients', sub_fields: [
                { name: 'ingredient_id', alias: 'ingredient_info', sub_fields: [
                    { name: '_id', alias: 'id' },
                    { name: 'name' },
                    { name: 'description' },
                    { name: 'category' },
                    { name: 'sub_category' },
                    { name: 'cover_url', alias: 'cover' }
                ] },
                { name: 'measure' },
                { name: 'optional' },
                { name: 'garnish' }
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
                { name: 'gallery_urls', alias: 'gallery' }
            ] },
            { name: 'gallery_urls', alias: 'gallery' },
            { name: 'tags' },
            { name: 'verified' },
            {
                name: 'user',
                condition: (document) => document instanceof UserDrink
            },
            {
                name: 'public',
                condition: (document) => document instanceof UserDrink && privacy_type === 'private'
            },
            {
                name: 'date_created',
                condition: (document) => document instanceof UserDrink && privacy_type === 'private'
            },
            {
                name: 'date_verified',
                condition: (document) => document instanceof VerifiedDrink && privacy_type === 'private'
            }
        ];
        
        res.status(200).send(responseObject(drinkInfo, responseFields));
    } catch(err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

module.exports.search = async (req, res) => {
    try {
        const { query, page = 1, page_size = 10, ordering, category_filter } = req.query;

        // Missing Filters

        const searchQuery = Drink
            .where({ name: { $regex: query } })
            .or([
                { model: 'Verified Drink' },
                { model: 'User Drink', public: true },
                (req.user ? { model: 'User Drink', user: req.user._id } : {})
            ]);

        const totalDocuments = await Drink.countDocuments(searchQuery);
        const responseDocuments = await Drink
            .find(searchQuery)
            .select('name tags assets')
            .sort(ordering)
            .skip((page - 1) * page_size)
            .limit(page_size)
            .then(documents => documents.map(doc => responseObject(doc, [
                { name: '_id', alias: 'id' },
                { name: 'name' },
                { name: 'tags' },
                { name: 'verified' },
                { name: 'cover_url', alias: 'cover' }
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
        console.log(err);
        res.status(500).send('Internal server error');
    }
}

module.exports.clientDrinks = async (req, res) => {
    // try {
    //     const { page, page_size, ordering } = req.query;
    //     const searchQuery = Drink.where({ name: req.user._id });

    //     const totalDocuments = await Drink.countDocuments(searchQuery);
    //     const responseDocuments = await Drink
    //         .find(searchQuery);
        
    //     const response = {
    //         page,
    //         page_size,
    //         total_pages: Math.ceil(totalDocuments / page_size),
    //         total_results: totalDocuments,
    //         data: responseDocuments
    //     };
    //     res.status(200).send(response);
    // } catch(err) {
    //     console.error(err);
    //     res.status(500).send('Internal server error');
    // }
}
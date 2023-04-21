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
            const galleryACLDocuments = await Promise.all(assets.gallery.map(async imageACL => {
                const aclDocument = await FileAccessControl.findOne({ _id: imageACL });
                if (!aclDocument.authorize('delete', { user: req.user }))
                    throw new AppError(403, 'FROBIDDEN', 'Drink contains images you are not authorized to modify');
                return aclDocument;
            }));
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
        else if (!(drinkInfo instanceof UserDrink))
            throw new AppError(400, 'INVALID_ARGUMENT', 'Privacy change is only allowed on non-verified drinks');
        else if (!req.ability.can('patch', subject('drinks', { document: drinkInfo })))
            throw new AppError(403, 'FORBIDDEN', 'Unauthorized to modify drink');

        drinkInfo.public = !drinkInfo.public;
        await drinkInfo.validate(); // issue occurs when attached docuements aren't public/verified
        const { assets } = drinkInfo;
        if (assets.gallery.length) {
            const galleryACLDocuments = await Promise.all(assets.gallery.map(async imageACL => {
                const aclDocument = await FileAccessControl.findOne({ _id: imageACL });
                if (!aclDocument.authorize('update', { user: req.user }))
                    throw new AppError(403, 'FROBIDDEN', 'Drink contains images you are not authorized to modify');
                return aclDocument;
            }));
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
            throw new AppError(409, 'CONFLICT', 'Adding uploads to drink gallery exceeds limit');

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

module.exports.removeGallery = async (req, res, next) => {
    try {
        const { drink_id } = req.params;
        const { gallery_ids } = req.body;

        if (!gallery_ids.length)
            throw new AppError(400, 'MISSING_REQUIRED_FIELD', 'No images were selected');
        
        const drinkInfo = await Drink.findOne({ _id: drink_id });
        if (!drinkInfo)
            throw new AppError(404, 'NOT_FOUND', 'Drink does not exist');
        else if (!req.ability.can('patch', subject('drinks', { document: drinkInfo })))
            throw new AppError(403, 'FORBIDDEN', 'Unauthorized to modify drink');
        
        const galleryACLDocuments = await Promise.allSettled(gallery_ids.map(async imageACL => {
            if (!drinkInfo.assets.gallery.includes(imageACL))
                throw new Error('Image does not exist in gallery');
            const aclDocument = await FileAccessControl.findOne({ _id: imageACL });
            if (!aclDocument.authorize('delete', { user: req.user }))
                throw new Error('Unauthorized to modify gallery images');
            return aclDocument;
        }));
        const invalidImages = galleryACLDocuments
            .filter(({ status }) => status === 'rejected')
            .map(({ reason }, index) => ({
                gallery_id: gallery_ids[index],
                message: reason.message
            }));
        if (invalidImages.length)
            throw new AppError(400, 'INVALID_ARGUMENT', 'Invalid images', invalidImages);

        await Promise.all(galleryACLDocuments.map(async ({ value:aclDocument }) => {
            const imageIndex = drinkInfo.assets.gallery.indexOf(aclDocument._id);
            await s3Operations.removeObject(aclDocument.file_path);
            await aclDocument.remove();
            drinkInfo.assets.gallery.splice(imageIndex, 1);
        }));
        await drinkInfo.save();
        res.status(204).send();
    } catch(err) {
        next(err);
    }
}

module.exports.copy = async (req, res, next) => {
    try {
        const { drink_id } = req.params;
        const drinkInfo = await Drink.findOne({ _id: drink_id });

        if (!drinkInfo)
            throw new AppError(404, 'NOT_FOUND', 'Drink does not exist');
        else if (
            !req.ability.can('read', subject('drinks', { action_type: 'public', document: drinkInfo })) ||
            !req.ability.can('create', subject('drinks', { subject_type: 'user' }))
        )
            throw new AppError(403, 'FORBIDDEN', 'Unauthorized to modify drink');
        else if (await UserDrink.exists({ user: req.user._id, name: drinkInfo.name }))
            throw new AppError(409, 'CONFLICT', 'A drink with that name already exists');

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
            user: req.user._id
        });
        
        if (drinkInfo.assets.gallery.length) {
            const galleryACLDocuments = await Promise.all(drinkInfo.assets.gallery.map(async imageACL => {
                const aclDocument = await FileAccessControl.findOne({ _id: imageACL });
                if (!aclDocument.authorize('read', { user: req.user }))
                    throw new AppError(403, 'FROBIDDEN', 'Drink contains images you are not authorized to view');
                return aclDocument;
            }));
            const galleryUploadInfo = await Promise.all(galleryACLDocuments.map(async aclDocument => {
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
                return createdACL;
            }));
            createdDrink.assets.gallery = galleryUploadInfo.map(uploadInfo => uploadInfo._id);
        }
        await createdDrink.save();
        res.status(204).send();
    } catch(err) {
        next(err);
    }
}

module.exports.getDrink = async (req, res, next) => {
    try {
        const { drink_id, privacy_type = 'public' } = req.params;
        const drinkInfo = await Drink
            .findOne({ _id: drink_id })
            .populate([
                {
                    path: 'ingredients',
                    populate: 'ingredient_info substitutes.ingredient_info'
                },
                { path: 'drinkware_info' },
                { path: 'tool_info' }
            ]);

        if (!drinkInfo) 
            throw new AppError(404, 'NOT_FOUND', 'Drink does not exist');
        else if (!req.ability.can('read', subject('drinks', { action_type: privacy_type, document: drinkInfo })))
            throw new AppError(403, 'FORBIDDEN', 'Unauthorized to view drink');
        
        const response = await responseObject(drinkInfo, [
            { name: '_id', alias: 'id' },
            { name: 'name' },
            { name: 'description' },
            { name: 'preparation_method_info', alias: 'preparation_method' },
            { name: 'serving_style_info', alias: 'serving_style' },
            { name: 'preparation' },
            { name: 'ingredients', child_fields: [
                { name: 'ingredient_info', alias: 'ingredient', child_fields: [
                    { name: '_id', alias: 'id' },
                    { name: 'name' },
                    { name: 'description' },
                    { name: 'classification_info', parent_fields: [
                        { name: 'category' },
                        { name: 'sub_category' },
                    ] },
                    { name: 'cover_url', alias: 'cover' }
                ] },
                { name: 'measure_info', alias: 'measure' },
                { name: 'substitutes', child_fields: [
                    { name: 'ingredient_info', alias: 'ingredient', child_fields: [
                        { name: '_id', alias: 'id' },
                        { name: 'name' },
                        { name: 'description' },
                        { name: 'classification_info', parent_fields: [
                            { name: 'category' },
                            { name: 'sub_category' },
                        ] },
                        { name: 'cover_url', alias: 'cover' }
                    ] },
                    { name: 'measure_info', alias: 'measure' }
                ] },
                { name: 'optional' },
                { name: 'garnish' }
            ] },
            { name: 'drinkware_info', alias: 'drinkware', child_fields: [
                { name: '_id', alias: 'id' },
                { name: 'name' },
                { name: 'description' },
                { name: 'cover_url', alias: 'cover' },
            ] },
            { name: 'tool_info', alias: 'tools', child_fields: [
                { name: '_id', alias: 'id' },
                { name: 'name' },
                { name: 'description' },
                { name: 'category_info' },
                { name: 'cover_url', alias: 'cover' }
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
        ]);
        res.status(200).send(response);
    } catch(err) {
        next(err);
    }
}

module.exports.search = async (req, res, next) => {
    try {
        const { query, page, page_size, ordering, preparation_methods, serving_styles } = req.query;
        var searchFilters;
        try {
            searchFilters = await Drink.searchFilters(preparation_methods, serving_styles);
        } catch(err) {
            throw new AppError(400, 'INVALID_ARGUMENT', err.message, err.errors);
        }

        const searchQuery = Drink
            .where({
                name: { $regex: query },
                $and: [
                    {
                        $or: [
                            { model: 'Verified Drink' },
                            { model: 'User Drink', public: true },
                            ...(req.user ? [{ model: 'User Drink', user: req.user._id }] : []),
                        ]
                    }, ...(searchFilters.length ? [{ $and: searchFilters }] : [])
                ]
            });
        const totalDocuments = await Drink.countDocuments(searchQuery);
        const responseDocuments = await Drink
            .find(searchQuery)
            .sort(ordering)
            .skip((page - 1) * page_size)
            .limit(page_size)
            .then(documents => Promise.all(documents.map(doc => responseObject(doc, [
                { name: '_id', alias: 'id' },
                { name: 'name' },
                { name: 'tags' },
                { name: 'verified' },
                { name: 'cover_url', alias: 'cover' },
                { name: 'public' }
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

module.exports.clientDrinks = async (req, res, next) => {
    try {
        const { page, page_size, ordering, preparation_methods, serving_styles } = req.query;
        var searchFilters;
        try {
            searchFilters = await Drink.searchFilters(preparation_methods, serving_styles);
        } catch(err) {
            throw new AppError(400, 'INVALID_ARGUMENT', err.message, err.errors);
        }

        const searchQuery = Drink
            .where({
                model: 'User Drink',
                user: req.user._id,
                ...(searchFilters.length ? { $and: searchFilters } : {})
            });
        const totalDocuments = await Drink.countDocuments(searchQuery);
        const responseDocuments = await Drink
            .find(searchQuery)
            .sort(ordering)
            .skip((page - 1) * page_size)
            .limit(page_size)
            .then(documents => Promise.all(documents.map(doc => responseObject(doc, [
                { name: '_id', alias: 'id' },
                { name: 'name' },
                { name: 'tags' },
                { name: 'verified' },
                { name: 'cover_url', alias: 'cover' },
                { name: 'public' }
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

module.exports.getPreparationMethods = async (req, res, next) => {
    try {
        const drinkPreparationMethods = await Drink.getPreparationMethods();
        res.status(200).send(drinkPreparationMethods);
    } catch(err) {
        next(err);
    }
}

module.exports.getServingStyles = async (req, res, next) => {
    try {
        const drinkServingStyles = await Drink.getServingStyles();
        res.status(200).send(drinkServingStyles);
    } catch(err) {
        next(err);
    }
}
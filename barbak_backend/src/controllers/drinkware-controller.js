const { Drinkware, VerifiedDrinkware, UserDrinkware } = require('../models/drinkware-model');
const FileAccessControl = require('../models/file-access-control-model');
const { subject } = require('@casl/ability');
const AppError = require('../utils/app-error');
const fileOperations = require('../utils/file-operations');
const s3Operations = require('../utils/aws-s3-operations');
const responseObject = require('../utils/response-object');

module.exports.create = async (req, res, next) => {
    try {
        const { drinkware_type = 'user' } = req.params;

        if (!req.ability.can('create', subject('drinkwsare', { subject_type: drinkware_type })))
            throw new AppError(403, 'FORBIDDEN', 'Unauthorized to create drinkware');
        else if (drinkware_type === 'user' ?
            await UserDrinkware.exists({ user: req.user._id, name: req.body.name }) :
            await VerifiedDrinkware.exists({ name: req.body.name })
        )
            throw new AppError(409, 'ALREADY_EXIST', 'A drinkware with that name currently exists');

        const createdDrinkware = drinkware_type === 'user' ?
            new UserDrinkware({
                ...req.body,
                user: req.user._id
            }) :
            new VerifiedDrinkware(req.body);
        await createdDrinkware.validate();
        await createdDrinkware.save();

        const responseFields = [
            { name: "_id", alias: "id" },
            { name: "name" },
            { name: "description"},
            { name: "cover_url", alias: "cover" },
            {
                name: "public",
                condition: (document) => document instanceof UserDrinkware
            },
            {
                name: "date_created",
                condition: (document) => document instanceof UserDrinkware
            },
            {
                name: "date_verified",
                condition: (document) => document instanceof VerifiedDrinkware
            }
        ];
        res.status(201).send(responseObject(createdDrinkware, responseFields));
    } catch(err) {
        next(err);
    }
}

module.exports.update = async (req, res) => {
    try {
        const { drinkware_id } = req.params;
        const drinkwareInfo = await Drinkware.findOne({ _id: drinkware_id });

        if (!drinkwareInfo)
            throw AppError(404, 'NOT_FOUND', 'Drinkware does not exist');
        else if (!req.ability.can('update', subject('drinkware', { document: drinkwareInfo })))
            throw AppError(403, 'FORBIDDEN', 'Unauthorized to modify drinkware');
        else if (drinkwareInfo instanceof UserDrinkware ?
            await UserDrinkware.exists({ user: req.user._id, name: req.body.name, _id: { $ne: drinkware_id } }) :
            await VerifiedDrinkware.exists({ name: req.body.name, _id: { $ne: drinkware_id } })
        )
            throw AppError(409, 'ALREADY_EXISTS', 'A drinkware with that name currently exists');

        drinkwareInfo.set(req.body);
        await drinkwareInfo.validate();
        await drinkwareInfo.save();

        res.status(204).send();
    } catch(err) {
        next(err);
    }
}

module.exports.delete = async (req, res, next) => {
    try {
        const { drinkware_id } = req.params;
        const drinkwareInfo = await Drinkware.findOne({ _id: drinkware_id });

        if (!drinkwareInfo)
            throw new AppError(404, 'NOT_FOUND', 'Drinkware does not exist');
        else if (!req.ability.can('delete', subject('drinkware', { document: drinkwareInfo })))
            throw new AppError(403, 'FORBIDDEN', 'Unauthorized to modify drinkware');

        if (drinkwareInfo.cover) {
            const aclDocument = await FileAccessControl.findOne({ _id: drinkwareInfo.cover });
            if (!aclDocument.authorize('delete', { user: req.user }))
                throw new AppError(403, 'FORBIDDEN', 'Unauthorized to modify drinkware cover image');
            
            await s3Operations.removeObject(aclDocument.file_path);
            await aclDocument.remove();
        }
        await drinkwareInfo.remove();
        res.status(204).send();
    } catch(err) {
        next(err);
    }
}

module.exports.updatePrivacy = async (req, res, next) => {
    try {
        const { drinkware_id } = req.params;
        const drinkwareInfo = await Drinkware.findOne({ _id: drinkware_id });

        if (!drinkwareInfo)
            throw new AppError(404, 'NOT_FOUND', 'Drinkware does not exist');
        else if (!drinkwareInfo instanceof UserDrinkware)
            throw new AppError(400, 'INVALID_ARGUMENT', 'Privacy change is only allowed on non-verified drinkware');
        else if (!req.ability.can('patch', subject('drinkware', { document: drinkwareInfo })))
            throw new AppError(403, 'FORBIDDEN', 'Unauthorized to modify drinkware');

        drinkwareInfo.public = !drinkwareInfo.public;
        if (drinkwareInfo.cover) {
            const aclDocument = await FileAccessControl.findOne({ _id: drinkwareInfo.cover });
            if (!aclDocument.authorize('update', { user: req.user }))
                throw new AppError(403, 'FORBIDDEN', 'Unauthorized to modify drinkware cover image');

            aclDocument.permissions = [
                { action: 'manage', conditions: { 'user._id': req.user._id } },
                ...(drinkwareInfo.public ? { action: 'read' } : {})
            ];
            await aclDocument.save();
        }
        await drinkwareInfo.save();
        res.status(204).send();
    } catch(err) {
        next(err);
    }
}

module.exports.uploadCover = async (req, res, next) => {
    try {
        const { drinkware_id } = req.params;
        const drinkwareCover = req.file;

        if (!drinkwareCover)
            throw new AppError(400, 'MISSING_REQUIRED_FILE', 'No image was uploaded');

        const drinkwareInfo = await Drinkware.findOne({ _id: drinkware_id });
        if (!drinkwareInfo)
            throw new AppError(404, 'NOT_FOUND', 'Drinkware does not exist');
        else if (!req.ability.can('patch', subject('drinkware', { document: drinkwareInfo })))
            throw new AppError(403, 'FORBIDDEN', 'Unauthorized to modify drinkware');

        if (drinkwareInfo.cover) {
            const aclDocument = await FileAccessControl.findOne({ _id: drinkwareInfo.cover });
            if (!aclDocument.authorize('update', { user: req.user }))
                throw new AppError(403, 'FORBIDDEN', 'Unauthorized to modify drinkware cover image');

            const [,uploadInfo] = await Promise.all([
                s3Operations.removeObject(aclDocument.file_path),
                s3Operations.createObject(drinkwareCover, 'assets/drinkware/images')
            ]);

            aclDocument.set({
                file_name: uploadInfo.filename,
                file_size: drinkwareCover.size,
                mime_type: drinkwareCover.mimetype,
                file_path: uploadInfo.filepath
            });
            await aclDocument.save();
        } else {
            const uploadInfo = await s3Operations.createObject(drinkwareCover, 'assets/drinkware/images');
            const createdACL = new FileAccessControl({
                file_name: uploadInfo.filename,
                file_size: drinkwareCover.size,
                mime_type: drinkwareCover.mimetype,
                file_path: uploadInfo.filepath,
                permissions: (drinkwareInfo instanceof UserDrinkware ?
                    [
                        { action: 'manage', condition: { 'user._id': req.user._id } },
                        ...(drinkwareInfo.public ? { action: 'read' } : {})
                    ] : [
                        { action: 'read' },
                        { action: 'manage', conditions: { 'user.role': 'admin' } },
                        { action: 'manage', conditions: { 'user.role': 'editor' } }
                    ]
                )
            });
            await createdACL.save();
            drinkwareInfo.cover = createdACL._id;
        }
        await drinkwareInfo.save();
        res.status(204).send();
    } catch(err) {
        next(err);
    } finally {
        fileOperations.deleteSingle(req.file.path)
        .catch(err => console.error(err));
    }
}

module.exports.deleteCover = async (req, res, next) => {
    try {
        const { drinkware_id } = req.params;
        const drinkwareInfo = await Drinkware.findOne({ _id: drinkware_id });

        if (!drinkwareInfo)
            throw new AppError(404, 'NOT_FOUND', 'Drinkware does not exist');
        else if (!req.ability.can('patch', subject('drinkware', { document: drinkwareInfo })))
            throw new AppError(403, 'FORBIDDEN', 'Unauthorized to modify drinkware');
        else if (!drinkwareInfo.cover)
            throw new AppError(404, 'NOT_FOUND', 'Drinkware does not have a cover image');

        const aclDocument = await FileAccessControl.findOne({ _id: drinkwareInfo.cover });
        if (!aclDocument.authorize('delete', { user: req.user }))
            throw new AppError(404, 'FORBIDDEN', 'Unauthorized to modify drinkware cover image');

        await s3Operations.removeObject(aclDocument.file_path);
        await aclDocument.remove();

        drinkwareInfo.cover = null;
        await drinkwareInfo.save();

        res.status(204).send();
    } catch(err) {
        next(err);
    }
}

module.exports.copy = async (req, res, next) => {
    try {
        const { drinkware_id } = req.params;
        const drinkwareInfo = await Drinkware.findOne({ _id: drinkware_id });

        if (!drinkwareInfo) 
            throw new AppError(404, 'NOT_FOUND', 'Drinkware does not exist');
        else if (
            (!req.ability.can('read', subject('drinkware', { action_type: 'public', document: drinkwareInfo }))) ||
            (!req.ability.can('create', subject('drinkware', { subject_type: 'user' })))
        )
            throw new AppError(403, 'FORBIDDEN', 'Unauthorized request');
        else if (await UserDrinkware.exists({ user: req.user._id, name: drinkwareInfo.name }))
            throw new AppError(409, 'ALREADY_EXIST', 'Name already associated with a drinkware');
        
        const { name, description } = drinkwareInfo;
        const createdDrinkware = new UserDrinkware({
            name,
            description,
            user: req.user._id
        });

        if (drinkwareInfo.cover) {
            const aclDocument = await FileAccessControl.findOne({ _id: drinkwareInfo.cover });
            if (!aclDocument.authorize('read', { user: req.user }))
                throw new AppError(403, 'FORBIDDEN', 'Unauthorized to view drinkware cover image');

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
            createdDrinkware.cover = createdACL._id;
        }
        await createdDrinkware.save();
        res.status(204).send();
    } catch(err) {
        next(err);
    }
}

module.exports.getDrinkware = async (req, res, next) => {
    try {
        const { drinkware_id, privacy_type = 'public' } = req.params;
        const drinkwareInfo = await Drinkware.findOne({ _id: drinkware_id });

        if (!drinkwareInfo)
            throw new AppError(404, 'NOT_FOUND', 'Drinkware does not exist');
        else if (!req.ability.can('read', subject('drinkware', {
            action_type: privacy_type,
            document: drinkwareInfo
        })))
            throw new AppError(403, 'FORBIDDEN', 'Unauthorized to view drinkware');

        const responseFields = [
            { name: '_id', alias: 'id'},
            { name: 'name' },
            { name: 'description' },
            { name: 'cover_url', alias: 'cover' },
            { name: 'verified' },
            {
                name: 'date_verified',
                condition: (document) => privacy_type === 'private' && document instanceof VerifiedDrinkware
            },
            {
                name: 'user',
                condition: (document) => document instanceof UserDrinkware
            },
            {
                name: 'date_created',
                condition: (document) => privacy_type === 'private' && document instanceof UserDrinkware
            },
            {
                name: 'public',
                condition: (document) => privacy_type === 'private' && document instanceof UserDrinkware
            }
        ];
        res.status(200).send(responseObject(drinkwareInfo, responseFields));
    } catch(err) {
        next(err);
    }
}

module.exports.search = async (req, res, next) => {
    try {
        const { query, page, page_size, ordering } = req.query;

        const searchQuery = Drinkware
            .where({ name: { $regex: query } })
            .or(req.user ? [
                { model: 'Verified Drinkware' },
                { user: req.user._id },
                { public: true }
            ] : [
                { model: 'Verified Drinkware' },
                { public: true }
            ]);

        const totalDocuments = await Drinkware.countDocuments(searchQuery);
        const responseDocuments = await Drinkware
            .find(searchQuery)
            .sort(ordering)
            .skip((page - 1) * page_size)
            .limit(page_size)
            .then(documents => documents.map(doc => responseObject(doc, [
                { name: '_id', alias: 'id' },
                { name: 'name' },
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
        next(err);
    }
}

module.exports.clientDrinkware = async (req, res, next) => {
    try {
        const { page, page_size, ordering } = req.query;
        const searchQuery = Drinkware.where({ user: req.user._id });

        const totalDocuments = await Drinkware.countDocuments(searchQuery);
        const responseDocuments = await Drinkware
            .find(searchQuery)
            .sort(ordering)
            .skip((page - 1) * page_size)
            .limit(page_size)
            .then(documents => documents.map(doc => responseObject(doc, [
                { name: '_id', alias: 'id' },
                { name: 'name' },
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
        next(err);
    }
}
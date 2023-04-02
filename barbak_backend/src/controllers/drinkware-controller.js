const { Drinkware, VerifiedDrinkware, UserDrinkware } = require('../models/drinkware-model');
const { AppAccessControl } = require('../models/access-control-model');
const { subject } = require('@casl/ability');
const fileOperations = require('../utils/file-operations');
const s3Operations = require('../utils/aws-s3-operations');

module.exports.create = async (req, res) => {
    try {
        const { name, description } = req.body;
        const { drinkware_type = 'user' } = req.params;

        if (!req.ability.can('create', subject('drinkware', { subject_type: drinkware_type })))
            return res.status(403).send({ path: 'drinkware_type', type: 'valid', message: 'Unauthorized to create drinkware' });
        else if (
            (drinkware_type === 'verified' && await VerifiedDrinkware.exists({ name })) ||
            (drinkware_type === 'user' && await UserDrinkware.exists({ user: req.user._id, name }))
        ) 
            return res.status(400).send({ path: 'name', type: 'exist', message: 'A drinkware with that name currently exists' });

        const createdDrinkware = ( drinkware_type === 'verified' ? new VerifiedDrinkware({
            name,
            description
        }) : new UserDrinkware({
            name,
            description,
            user: req.user._id
        }) );
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
        res.status(201).send(createdDrinkware.responseObject(responseFields));
    } catch(err) {
        if (err.name === 'ValidationError')
            return res.status(400).send(err);
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

module.exports.update = async (req, res) => {
    try {
        const { name, description } = req.body;
        const { drinkware_id } = req.params;
        const drinkwareInfo = await Drinkware.findOne({ _id: drinkware_id });

        if (!drinkwareInfo)
            return res.status(404).send({ path: 'drinkware_id', type: 'exist', message: 'Drinkware does not exist' });
        else if (!req.ability.can('update', subject('drinkware', { document: drinkwareInfo })))
            return res.status(403).send({ path: 'drinkware_id', type: 'valid', message: 'Unauthorized request' });
        else if (
            (drinkwareInfo instanceof UserDrinkware && await UserDrinkware.exists({ user: req.user._id, name, _id: { $ne: drinkware_id } })) ||
            (drinkwareInfo instanceof VerifiedDrinkware && await VerifiedDrinkware.exists({ name, _id: { $ne: drinkware_id } }))
        )
            return res.status(400).send({ path: 'name', type: 'exist', message: 'A drinkware with that name currently exists' });

        drinkwareInfo.set({
            name,
            description
        });

        await drinkwareInfo.validate();
        await drinkwareInfo.save();

        res.status(204).send();
    } catch(err) {
        if (err.name === 'ValidationError')
            return res.status(400).send(err);
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

module.exports.delete = async (req, res) => {
    try {
        const { drinkware_id } = req.params;
        const drinkwareInfo = await Drinkware.findOne({ _id: drinkware_id });
        
        if (!drinkwareInfo)
            return res.status(404).send({ path: 'drinkware_id', type: 'exist', message: 'Drinkware does not exist' });
        else if (!req.ability.can('delete', subject('drinkware', { document: drinkwareInfo })))
            return res.status(403).send({ path: 'drinkware_id', type: 'valid', message: 'Unauthorized request' });

        if (drinkwareInfo instanceof UserDrinkware && drinkwareInfo.cover_acl) {
            const aclDocument = await AppAccessControl.findOne({ _id: drinkwareInfo.cover_acl });
            await s3Operations.removeObject(aclDocument.file_path);
            await aclDocument.remove();
        } else if (drinkwareInfo instanceof VerifiedDrinkware && drinkwareInfo.cover) 
            await s3Operations.removeObject(drinkwareInfo.cover);

        await drinkwareInfo.remove();
        res.status(204).send();
    } catch(err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

module.exports.updatePrivacy = async (req, res) => {
    try {
        const { drinkware_id } = req.params;
        const drinkwareInfo = await UserDrinkware.findOne({ _id: drinkware_id });

        if (!drinkwareInfo)
            return res.status(404).send({ path: 'drinkware_id', type: 'exist', message: 'Drinkware does not exist' });
        else if (!req.ability.can('patch', subject('drinkware', { document: drinkwareInfo })))
            return res.status(403).send({ path: 'drinkware_id', type: 'valid', message: 'Unauthorized request' });

        drinkwareInfo.public = !drinkwareInfo.public;
        await drinkwareInfo.save();
        
        res.status(204).send();
    } catch(err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

module.exports.uploadCover = async (req, res) => {
    try {
        const { drinkware_id } = req.params;
        const drinkwareCover = req.file;

        if (!drinkwareCover)
            return res.status(400).send({ path: 'image', type: 'exist', message: 'No image was uploaded' });

        const drinkwareInfo = await Drinkware.findOne({ _id: drinkware_id });
        if (!drinkwareInfo)
            return res.status(404).send({ path: 'drinkware_id', type: 'exist', message: 'Drinkware does not exist' });
        else if (!req.ability.can('patch', subject('drinkware', { document: drinkwareInfo })))
            return res.status(403).send({ path: 'drinkware_id', type: 'valid', message: 'Unauthorized request' });
        
        if (drinkwareInfo instanceof UserDrinkware) {
            const uploadInfo = await s3Operations.createObject(drinkwareCover, 'assets/private/images');
            if (drinkwareInfo.cover_acl) {
                const aclDocument = await AppAccessControl.findOne({ _id: drinkwareInfo.cover_acl });
                await s3Operations.removeObject(aclDocument.file_path);

                aclDocument.set({
                    file_name: uploadInfo.filename,
                    file_size: drinkwareCover.size,
                    mime_type: drinkwareCover.mimetype,
                    file_path: uploadInfo.filepath
                });
                await aclDocument.save();
            } else {
                const createdACL = new AppAccessControl({
                    file_name: uploadInfo.filename,
                    file_size: drinkwareCover.size,
                    mime_type: drinkwareCover.mimetype,
                    file_path: uploadInfo.filepath,
                    user: req.user._id,
                    referenced_document: drinkwareInfo._id,
                    referenced_model: 'Drinkware'
                });
                await createdACL.save();
                drinkwareInfo.cover_acl = createdACL._id;
            }
        } else {
            const uploadInfo = await s3Operations.createObject(drinkwareCover, 'assets/public/images');
            if (drinkwareInfo.cover)
                await s3Operations.removeObject(drinkwareInfo.cover);
            drinkwareInfo.cover = uploadInfo.filepath;
        }
        await drinkwareInfo.save();
        
        res.status(204).send();
    } catch(err) {
        console.error(err);
        res.status(500).send('Internal server error');
    } finally {
        if (req.file) {
            await fileOperations.deleteSingle(req.file.path)
            .catch(err => console.error(err));
        }
    }
}

module.exports.deleteCover = async (req, res) => {
    try {
        const { drinkware_id } = req.params;
        const drinkwareInfo = await Drinkware.findOne({ _id: drinkware_id });

        if (!drinkwareInfo)
            return res.status(404).send({ path: 'drinkware_id', type: 'exist', message: 'Drinkware does not exist' });
        else if (!req.ability.can('patch', subject('drinkware', { document: drinkwareInfo })))
            return res.status(403).send({ path: 'drinkware_id', type: 'valid', message: 'Unauthorized request' });
        else if (
            (drinkwareInfo instanceof UserDrinkware && !drinkwareInfo.cover_acl) ||
            (drinkwareInfo instanceof VerifiedDrinkware && !drinkwareInfo.cover)
        )
            return res.status(404).send({ path: 'image', type: 'exist', message: 'Drinkware does not have a cover image' });

        if (drinkwareInfo instanceof UserDrinkware) {
            const aclDocument = await AppAccessControl.findOne({ _id: drinkwareInfo.cover_acl });
            await s3Operations.removeObject(aclDocument.file_path);
            await aclDocument.remove();
            drinkwareInfo.cover_acl = null;
        } else {
            await s3Operations.removeObject(drinkwareInfo.cover);
            drinkwareInfo.cover = null;
        }

        await drinkwareInfo.save();
        res.status(204).send();
    } catch(err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

module.exports.copy = async (req, res) => {
    try {
        const { drinkware_id } = req.params;
        const drinkwareInfo = await Drinkware.findOne({ _id: drinkware_id });

        if (!drinkwareInfo) 
            return res.status(404).send({ path: 'drinkware_id', type: 'exist', message: 'Drinkware does not exist' });
        else if (
            (!req.ability.can('read', subject('drinkware', { action_type: 'public', document: drinkwareInfo }))) ||
            (!req.ability.can('create', subject('drinkware', { subject_type: 'user' })))
        )
            return res.status(403).send({ path: 'drinkware_id', type: 'valid', message: 'Unauthorized request' });
        else if (await UserDrinkware.exists({ user: req.user._id, name: drinkwareInfo.name }))
            return res.status(400).send({ path: 'name', type: 'exist', message: 'A drinkware with that name currently exists' });

        const { name, description } = drinkwareInfo;
        const createdDrinkware = new UserDrinkware({
            name,
            description,
            user: req.user._id,
        });

        if (
            (drinkwareInfo instanceof UserDrinkware && drinkwareInfo.cover_acl) ||
            (drinkwareInfo instanceof VerifiedDrinkware && drinkwareInfo.cover)
        ) {
            var coverPath;
            if (drinkwareInfo instanceof UserDrinkware) {
                const aclDocument = await AppAccessControl.findOne({ _id: drinkwareInfo.cover_acl });
                coverPath = aclDocument.file_path;
            } else
                coverPath = drinkwareInfo.cover;
            
            const copyInfo = await s3Operations.copyObject(coverPath);
            const copyMetadata = await s3Operations.objectMetadata(copyInfo.filepath);
            const createdACL = new AppAccessControl({
                file_name: copyInfo.filename,
                file_size: copyMetadata.ContentLength,
                mime_type: copyMetadata.ContentType,
                file_path: copyInfo.filepath,
                user: req.user._id,
                referenced_document: createdDrinkware._id,
                referenced_model: 'Drinkware'
            });
            await createdACL.save();
            createdDrinkware.cover_acl = createdACL._id;
        }       
        await createdDrinkware.save();

        res.status(204).send();
    } catch(err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

module.exports.getDrinkware = async (req, res) => {
    try {
        const { drinkware_id, privacy_type = 'public' } = req.params;
        const drinkwareInfo = await Drinkware.findOne({ _id: drinkware_id });

        if (!drinkwareInfo)
            return res.status(404).send({ path: 'drinkware_id', type: 'exist', message: 'Drinkware does not exist' });
        else if (!req.ability.can('read', subject('drinkware', {
            action_type: privacy_type,
            document: drinkwareInfo
        })))
            return res.status(403).send({ path: 'drinkware_id', type: 'valid', message: 'Unauthorized request' });

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
        res.status(200).send(drinkwareInfo.responseObject(responseFields));
    } catch(err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

module.exports.search = async (req, res) => {
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
        const responseDocuments = await Drinkware.find(searchQuery)
            .sort(ordering)
            .skip((page - 1) * page_size)
            .limit(page_size)
            .then(documents => documents.map(doc => doc.responseObject([
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
        console.log(err);
        res.status(500).send('Internal server error');
    }
}

module.exports.clientDrinkware = async (req, res) => {
    try {
        const { page, page_size, ordering } = req.query;
        const searchQuery = Drinkware.where({ user: req.user._id });

        const totalDocuments = await Drinkware.countDocuments(searchQuery);
        const responseDocuments = await Drinkware
            .find(searchQuery)
            .sort(ordering)
            .skip((page - 1) * page_size)
            .limit(page_size)
            .then(documents => documents.map(doc => doc.responseObject([
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
        console.error(err);
        res.status(500).send('Internal server error');
    }
}
const { Drinkware, VerifiedDrinkware, UserDrinkware } = require('../models/drinkware-model');
const { AppAccessControl } = require('../models/access-control-model');
const { subject } = require('@casl/ability');
const fileOperations = require('../utils/file-operations');
const s3Operations = require('../utils/aws-s3-operations');

module.exports.create = async (req, res) => {
    try {
        const { name, description, verified } = req.body;

        if (!req.ability.can('create', subject('drinkware', { verified })))
            return res.status(403).send({ path: 'verified', type: 'valid', message: 'Unauthorized to create drinkware' });
        else if (
            (verified && await VerifiedDrinkware.exists({ name })) ||
            (!verified && await UserDrinkware.exists({ user: req.user._id, name }))
        ) 
            return res.status(400).send({ path: 'name', type: 'exist', message: 'A drinkware with that name currently exists' });

        const createdDrinkware = ( verified ? new VerifiedDrinkware({
            name,
            description
        }) : new UserDrinkware({
            name,
            description,
            user: req.user._id
        }) );
        await createdDrinkware.validate();
        await createdDrinkware.save();

        res.status(201).send(Object.assign({
            id: createdDrinkware._id,
            name: createdDrinkware.name,
            description: createdDrinkware.description,
            cover: createdDrinkware.cover_url,
            date_created: createdDrinkware.date_created,
            date_verified: createdDrinkware.date_verified,
            public: createdDrinkware.public
        }));
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
        else if (!req.ability.can('update', subject('drinkware', drinkwareInfo)))
            return res.status(403).send({ path: 'drinkware_id', type: 'valid', message: 'Unauthorized request' });
        else if (
            (drinkwareInfo.model === 'User Drinkware' && await UserDrinkware.exists({ user: req.user._id, name, _id: { $ne: drinkware_id } })) ||
            (drinkwareInfo.model === 'Verified Drinkware' && await VerifiedDrinkware.exists({ name, _id: { $ne: drinkware_id } }))
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
        else if (!req.ability.can('delete', subject('drinkware', drinkwareInfo)))
            return res.status(403).send({ path: 'drinkware_id', type: 'valid', message: 'Unauthorized request' });

        if (drinkwareInfo.model === 'User Drinkware' && drinkwareInfo.cover_acl) {
            const aclDocument = await AppAccessControl.findOne({ _id: drinkwareInfo.cover_acl });
            await s3Operations.removeObject(aclDocument.file_path);
            await aclDocument.remove();
        } else if (drinkwareInfo.model === 'Verified Drinkware' && drinkwareInfo.cover) 
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
        else if (!req.ability.can('patch', subject('drinkware', drinkwareInfo)))
            return res.status(403).send({ path: 'drinkware_id', type: 'valid', message: 'Unauthorized request' });

        drinkwareInfo.public = !drinkwareInfo.public;
        await drinkwareInfo.save();
        
        res.status(200).send({
            public: drinkwareInfo.public
        });
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
        else if (!req.ability.can('patch', subject('drinkware', drinkwareInfo)))
            return res.status(403).send({ path: 'drinkware_id', type: 'valid', message: 'Unauthorized request' });
        
        if (drinkwareInfo.model === 'User Drinkware') {
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
        
        res.status(200).send({
            cover: drinkwareInfo.cover_url
        });
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
        else if (!req.ability.can('patch', subject('drinkware', drinkwareInfo)))
            return res.status(403).send({ path: 'drinkware_id', type: 'valid', message: 'Unauthorized request' });
        else if (
            (drinkwareInfo.model === 'User Drinkware' && !drinkwareInfo.cover_acl) ||
            (drinkwareInfo.model === 'Verified Drinkware' && !drinkwareInfo.cover)
        )
            return res.status(404).send({ path: 'image', type: 'exist', message: 'Drinkware does not have a cover image' });

        if (drinkwareInfo.model === 'User Drinkware') {
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
            (!req.ability.can('read', subject('drinkware', drinkwareInfo))) ||
            (!req.ability.can('create', subject('drinkware', { verified: false })))
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
            (drinkwareInfo.model === 'User Drinkware' && drinkwareInfo.cover_acl) ||
            (drinkwareInfo.model === 'Verified Drinkware' && drinkwareInfo.cover)
        ) {
            var coverPath;
            if (drinkwareInfo.model === 'User Drinkware') {
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

        res.status(200).send({
            id: createdDrinkware._id,
            cover: createdDrinkware.cover_url,
            name: createdDrinkware.name,
            description: createdDrinkware.description,
            date_created: createdDrinkware.date_created,
            public: createdDrinkware.public
        });
    } catch(err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

module.exports.getDrinkware = async (req, res) => {
    try {
        const { drinkware_id } = req.params;
        const drinkwareInfo = await Drinkware.findOne({ _id: drinkware_id });

        if (!drinkwareInfo)
            return res.status(404).send({ path: 'drinkware_id', type: 'exist', message: 'Drinkware does not exist' });
        else if (!req.ability.can('read', subject('drinkware', drinkwareInfo)))
            return res.status(403).send({ path: 'drinkware_id', type: 'valid', message: 'Unauthorized request' });
        
        res.status(200).send(Object.assign({
            id: drinkwareInfo._id,
            name: drinkwareInfo.name,
            description: drinkwareInfo.description,
            cover: drinkwareInfo.cover_url,
            user: drinkwareInfo.user
        }));

    } catch(err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

module.exports.search = async (req, res) => {
    try {
        const { query, page, page_size, ordering } = req.query;
        const searchDocuments = await Drinkware
            .find({ name: { $regex: query } })
            .where(req.user ?
                {
                    $or: [
                        { model: 'Verified Drinkware' },
                        { user: req.user._id },
                        { public: true }
                    ]
                } :
                {
                    $or: [
                        { model: 'Verified Drinkware' },
                        { public: true }
                    ]
                }
            )
            .sort(ordering)
            .skip((page - 1) * page_size)
            .limit(page_size)
            .then(documents => documents.map(doc => Object.assign({
                id: doc._id,
                name: doc.name,
                description: doc.description,
                cover: doc.cover_url,
                user: doc.user
            })));

        res.status(200).send(searchDocuments);
    } catch(err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

module.exports.clientDrinkware = async (req, res) => {
    try {
        const { page, page_size, ordering } = req.query;
        const userDocuments = await UserDrinkware
            .find({ user: req.user._id })
            .sort(ordering)
            .skip((page - 1) * page_size)
            .limit(page_size)
            .then(documents => documents.map(doc => Object.assign({
                id: doc._id,
                name: doc.name,
                description: doc.description,
                cover: doc.cover_url,
                public: doc.public,
                date_created: doc.date_created
            })));

        res.status(200).send(userDocuments);
    } catch(err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
}
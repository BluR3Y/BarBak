const mongoose = require('mongoose');
const fileOperations = require('../utils/file-operations');
const { subject } = require('@casl/ability');
const { Drinkware, VerifiedDrinkware, UserDrinkware } = require('../models/drinkware-model');
const { AppAccessControl, AccessControl } = require('../models/access-control-model');

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

        res.status(204).send();
    } catch(err) {
        if (err.name === 'ValidationError')
            return res.status(400).send(err);
        res.status(500).send(err);
    }
}

module.exports.update = async (req, res) => {
    try {
        const { drinkware_id, name, description } = req.body;

        if (!mongoose.Types.ObjectId.isValid(drinkware_id))
            return res.status(400).send({ path: 'drinkware_id', type: 'valid', message: 'Invalid drinkware id' });
        
        const drinkwareInfo = await Drinkware.findOne({ _id: drinkware_id });
        if (!drinkwareInfo)
            return res.status(404).send({ path: 'drinkware_id', type: 'exist', message: 'Drinkware does not exist' });
        else if (!req.ability.can('update', subject('drinkware', drinkwareInfo)))
            return res.status(403).send({ path: 'drinkware_id', type: 'valid', message: 'Unauthorized request' });
        else if (drinkwareInfo.model === 'Verified Drinkware' ? 
            await VerifiedDrinkware.exists({ name, _id: { $ne: drinkware_id } }) :
            await UserDrinkware.exists({ user: req.user._id, name, _id: { $ne: drinkware_id } })
        )
            return res.status(400).send({ path: 'name', type: 'exist', message: 'A drinkware with that name currently exists' });
        
        drinkwareInfo.name = name;
        drinkwareInfo.description = description;

        await drinkwareInfo.validate();
        await drinkwareInfo.save();

        res.status(204).send();
    } catch(err) {
        if (err.name === 'ValidationError')
            return res.status(400).send(err);
        res.status(500).send(err);
    }
}

module.exports.delete = async (req, res) => {
    try {
        const { drinkware_id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(drinkware_id))
            return res.status(400).send({ path: 'drinkware_id', type: 'valid', message: 'Invalid drinkware id' });
        
        const drinkwareInfo = await Drinkware.findOne({ _id: drinkware_id });
        if (!drinkwareInfo)
            return res.status(404).send({ path: 'drinkware_id', type: 'exist', message: 'Drinkware does not exist' });
        else if (!req.ability.can('delete', subject('drinkware', drinkwareInfo)))
            return res.status(403).send({ path: 'drinkware_id', type: 'valid', message: 'Unauthorized request' });
        
        if (drinkwareInfo.cover)
            await fileOperations.deleteSingle(drinkwareInfo.cover);

        await drinkwareInfo.remove();
        res.status(204).send();
    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports.updatePrivacy = async (req, res) => {
    try {
        const { drinkware_id } = req.params;
    
        if (!mongoose.Types.ObjectId.isValid(drinkware_id))
            return res.status(400).send({ path: 'drinkware_id', type: 'valid', message: 'Invalid drinkware id' });

        const drinkwareInfo = await UserDrinkware.findOne({ _id: drinkware_id });
        if (!drinkwareInfo)
            return res.status(404).send({ path: 'drinkware_id', type: 'exist', message: 'Drinkware does not exist' });
        else if (!req.ability.can('update', subject('drinkware', drinkwareInfo)))
            return res.status(403).send({ path: 'drinkware_id', type: 'valid', message: 'Unauthorized request' });

        drinkwareInfo.public = !drinkwareInfo.public;
        await drinkwareInfo.save();
        res.status(200).send(drinkwareInfo);
    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports.getDrinkware = async (req, res) => {
    try {
        const { drinkware_id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(drinkware_id))
            return res.status(400).send({ path: 'drinkware_id', type: 'valid', message: 'Invalid drinkware id' });
        
        const drinkwareInfo = await Drinkware.findOne({ _id: drinkware_id });
        if (!drinkwareInfo)
            return res.status(404).send({ path: 'drinkware_id', type: 'exist', message: 'Drinkware does not exist' });
        else if (!req.ability.can('read', subject('drinkware', drinkwareInfo)))
            return res.status(403).send({ path: 'drinkware_id', type: 'valid', message: 'Unauthorized view drinkware' });

        res.status(200).send(drinkwareInfo.basicStripExcess());
    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports.copy = async (req, res) => {
    try {
        const { drinkware_id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(drinkware_id))
            return res.status(400).send({ path: 'drinkware_id', type: 'valid', message: 'Invalid drinkware id' });
        
        const drinkwareInfo = await Drinkware.findOne({ _id: drinkware_id });
        if (!drinkwareInfo) 
            return res.status(404).send({ path: 'drinkware_id', type: 'exist', message: 'Drinkware does not exist' });
        else if (!req.ability.can('read', subject('drinkware', drinkwareInfo)))
            return res.status(403).send({ path: 'drinkware_id', type: 'valid', message: 'Unauthorized to view drinkware' });
        else if (await UserDrinkware.exists({ user: req.user._id, name: drinkwareInfo.name }))
            return res.status(400).send({ path: 'name', type: 'exist', message: 'A drinkware with that name currently exists' });
        
        const { name, description, cover } = drinkwareInfo;
        const createdDrinkware = new UserDrinkware({
            name,
            description,
            user: req.user._id,
            cover: cover ? await fileOperations.copySingle(drinkwareInfo.cover) : null
        });
        await createdDrinkware.save();

        res.status(204).send();
    } catch(err) {
        if (err.name === 'ValidationError')
            return res.status(400).send(err);
        res.status(500).send(err);
    }
}

module.exports.uploadCover = async (req, res) => {
    try {
        const { drinkware_id } = req.body;
        var drinkwareCover = req.file;

        if (!drinkwareCover)
            return res.status(400).send({ path: 'image', type: 'exist', message: 'No image was uploaded' });
        
        if (!mongoose.Types.ObjectId.isValid(drinkware_id)) {
            await fileOperations.deleteSingle(drinkwareCover.path);
            return res.status(400).send({ path: 'drinkware_id', type: 'valid', message: 'Invalid drinkware id' });
        }

        const drinkwareInfo = await Drinkware.findOne({ _id: drinkware_id });
        if (!drinkwareInfo) {
            await fileOperations.deleteSingle(drinkwareCover.path);
            return res.status(404).send({ path: 'drinkware_id', type: 'exist', message: 'Drinkware does not exist' });
        } else if (!req.ability.can('update', subject('drinkware', drinkwareInfo))) {
            await fileOperations.deleteSingle(drinkwareCover.path);
            return res.status(403).send({ path: 'drinkware_id', type: 'valid', message: 'Unauthorized request' });
        }

        drinkwareCover.path = await fileOperations.moveSingle(drinkwareCover.path, drinkwareInfo.model === 'User Drinkware' ? './assets/private/images' : './assets/public/images');
        if (drinkwareInfo.model === 'User Drinkware') {
            if (drinkwareInfo.cover) {
                const aclDocument = await AppAccessControl.getDocument(drinkwareInfo.cover);
                await fileOperations.deleteSingle(aclDocument.file_path);
                aclDocument.updateInstance(drinkwareCover);
                await aclDocument.save();
                drinkwareInfo.cover = 'assets/private/' + aclDocument._id;
            } else {
                const createdACL = AppAccessControl.createInstance(drinkwareCover, req.user._id, drinkwareInfo._id);
                await createdACL.save();
                drinkwareInfo.cover = 'assets/private/' + createdACL._id;
            }
        } else {
            if (drinkwareInfo.cover)
                await fileOperations.deleteSingle(drinkwareInfo.cover);
            drinkwareInfo.cover = drinkwareCover.path;
        }

        await drinkwareInfo.save();
        res.status(204).send();
    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports.deleteCover = async (req, res) => {
    try {
        const { drinkware_id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(drinkware_id))
            return res.status(400).send({ path: 'drinkware_id', type: 'valid', message: 'Invalid drinkware id' });
        
        const drinkwareInfo = await Drinkware.findOne({ _id: drinkware_id });
        if (!drinkwareInfo)
            return res.status(404).send({ path: 'drinkware_id', type: 'exist', message: 'Drinkware does not exist' });
        else if (!req.ability.can('patch', subject('drinkware', drinkwareInfo)))
            return res.status(403).send({ path: 'drinkware_id', type: 'valid', message: 'Unauthorized to view drinkware' });
        else if (!drinkwareInfo.cover)
            return res.status(404).send({ path: 'image', type: 'exist', message: 'Drinkware does not have a cover image' });
        
        if (drinkwareInfo.model === 'User Drinkware') {
            const aclDocument = await AppAccessControl.getDocument(drinkwareInfo.cover);
            await fileOperations.deleteSingle(aclDocument.file_path);
            await aclDocument.remove();
        } else {
            await fileOperations.deleteSingle(drinkwareInfo.cover);
        }

        drinkwareInfo.cover = null;
        await drinkwareInfo.save();
        res.status(204).send();
    } catch(err) {
        res.status(500).send(err);
    }
}

// module.exports.search = async (req, res) => {
//     try {
//         const query = req.query.query || '';
//         const page = req.query.page || 1;
//         const page_size = req.query.page_size || 10;
//         const ordering = req.query.ordering ? JSON.parse(req.query.ordering) : [];
//         console.log(req.body)
//         const searchDocuments = await Drinkware
//             .find({ name: { $regex: query } })
//             .conditionalSearch(req.user)
//             .sort(ordering)
//             .skip((page - 1) * page_size)
//             .limit(page_size)
//             .basicInfo();
        
//         res.status(200).send(searchDocuments);
//     } catch(err) {
//         console.log(err)
//         res.status(500).send(err);
//     }
// }

module.exports.search = async (req, res) => {
    try {
        const { query, page, page_size, ordering } = req.query;

        console.log(query, page, page_size);
    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports.clientDrinkware = async (req, res) => {
    try {
        const page = req.query.page || 1;
        const page_size = req.query.page_size || 10;
        const ordering = req.query.ordering ? JSON.parse(req.query.ordering) : [];

        const userDocs = await UserDrinkware
            .find({ user: req.user._id })
            .sort(ordering)
            .skip((page - 1) * page_size)
            .limit(page_size)
            .extendedInfo();
            
        res.status(200).send(userDocs);
    } catch(err) {
        res.status(500).send(err);
    }
}
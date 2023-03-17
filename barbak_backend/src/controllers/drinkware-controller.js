const mongoose = require('mongoose');
const fileOperations = require('../utils/file-operations');
const { subject } = require('@casl/ability');
const { Drinkware, VerifiedDrinkware, UserDrinkware } = require('../models/drinkware-model');
const { AppAccessControl } = require('../models/access-control-model');

module.exports.create = async (req, res) => {
    try {
        const { verified , name, description } = req.body;

        if (!req.ability.can('create', subject('drinkware', { verified })))
            return res.status(401).send({ path: 'verified', type: 'valid', message: 'Unauthorized to create drinkware' });
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
            return res.status(400).send({ path: 'drinkware_id', type: 'exist', message: 'Drinkware does not exist' });
        else if (!req.ability.can('update', subject('drinkware', drinkwareInfo)))
            return res.status(401).send({ path: 'drinkware_id', type: 'valid', message: 'Unauthorized request' });
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
            return res.status(400).send({ path: 'drinkware_id', type: 'exist', message: 'Drinkware does not exist' });
        else if (!req.ability.can('delete', subject('drinkware', drinkwareInfo)))
            return res.status(401).send({ path: 'drinkware_id', type: 'valid', message: 'Unauthorized request' });
        
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
            return res.status(400).send({ path: 'drinkware_id', type: 'exist', message: 'Drinkware does not exist' });
        else if (!req.ability.can('update', subject('drinkware', drinkwareInfo)))
            return res.status(401).send({ path: 'drinkware_id', type: 'valid', message: 'Unauthorized request' });

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
            return res.status(400).send({ path: 'drinkware_id', type: 'exist', message: 'Drinkware does not exist' });
        else if (!req.ability.can('read', subject('drinkware', drinkwareInfo)))
            return res.status(401).send({ path: 'drinkware_id', type: 'valid', message: 'Unauthorized view drinkware' });

        res.status(200).send(drinkwareInfo.getBasicInfo());
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
            return res.status(400).send({ path: 'drinkware_id', type: 'exist', message: 'Drinkware does not exist' });
        else if (!req.ability.can('read', subject('drinkware', drinkwareInfo)))
            return res.status(401).send({ path: 'drinkware_id', type: 'valid', message: 'Unauthorized to view drinkware' });
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
        const drinkwareCover = req.file;

        if (!drinkwareCover)
            return res.status(400).send({ path: 'image', type: 'exist', message: 'No image was uploaded' });
        
        const filepath = '/' + drinkwareCover.destination + drinkwareCover.filename;
        if (!mongoose.Types.ObjectId.isValid(drinkware_id)) {
            await fileOperations.deleteSingle(filepath);
            return res.status(400).send({ path: 'drinkware_id', type: 'valid', message: 'Invalid drinkware id' });
        }

        const drinkwareInfo = await Drinkware.findOne({ _id: drinkware_id });
        if (!drinkwareInfo) {
            await fileOperations.deleteSingle(filepath);
            return res.status(400).send({ path: 'drinkware_id', type: 'exist', message: 'Drinkware does not exist' });
        } else if (!req.ability.can('update', subject('drinkware', drinkwareInfo))) {
            await fileOperations.deleteSingle(filepath);
            return res.status(401).send({ path: 'drinkware_id', type: 'valid', message: 'Unauthorized request' });
        }
        
        if (drinkwareInfo.model === 'Verified Drinkware') {
            if(drinkwareInfo.cover) {
                try {
                    await fileOperations.deleteSingle(drinkwareInfo.cover);
                } catch(err) {
                    // Implement Error Logging
                    console.log(err);
                }
            }
            drinkwareInfo.cover = filepath;
        } else {
            if (drinkwareInfo.cover) {
                const aclDocument = await AppAccessControl.getDocument(drinkwareInfo.cover);
                try {
                    await fileOperations.deleteSingle(aclDocument.file_path);
                } catch(err) {
                    // Implement Error Logging
                    console.log(err);
                }
                aclDocument.updateInstance(drinkwareCover);
                await aclDocument.save();
                drinkwareInfo.cover = '/assets/private/' + aclDocument._id;
            } else {
                const createdACL = AppAccessControl.createInstance(drinkwareCover, req.user._id, drinkwareInfo._id);
                await createdACL.save();
                drinkwareInfo.cover = '/assets/private/' + createdACL._id;
            }
        }
        
        await drinkwareInfo.save();
        res.status(204).send();
    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports.search = async (req, res) => {
    try {
        const query = req.query.query || '';
        const page = req.query.page || 1;
        const page_size = req.query.page_size || 10;
        const ordering = req.query.ordering ? JSON.parse(req.query.ordering) : [];

        var searchConditions = Drinkware.where({ name: { $regex: query } })
            .sort(ordering)
            .skip((page - 1) * page_size)
            .limit(page_size)
            .select('_id name description cover date_verified date_created user');
        
        if (req.user) 
            searchConditions = searchConditions.where({ $or: [{ model: 'Verified Drinkware' },{ user: req.user._id },{ public: true }] });
        else
            searchConditions = searchConditions.where({ model: 'Verified Drinkware' },{ public: true });
            
        res.status(200).send(await searchConditions);
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
            .authorInfo();
            
        res.status(200).send(userDocs);
    } catch(err) {
        res.status(500).send(err);
    }
}
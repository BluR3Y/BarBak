const mongoose = require('mongoose');
const fileOperations = require('../utils/file-operations');
const { subject } = require('@casl/ability');
const { Drinkware, VerifiedDrinkware, UserDrinkware } = require('../models/drinkware-model');

module.exports.create = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (await UserDrinkware.exists({ user: req.user._id, name }))
            return res.status(400).send({ path: 'name', type: 'exist', message: 'A drinkware with that name currently exists' });

        const createdDrinkware = new UserDrinkware({
            name,
            description,
            user: req.user._id
        });
        await createdDrinkware.validate();
        await createdDrinkware.save();

        res.status(204).send();
    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports.createVerified = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (await VerifiedDrinkware.exists({ name }))
            return res.status(400).send({ path: 'name', type: 'exist', message: 'A verified drinkware with that name currently exists' });
        
        const createdDrinkware = new VerifiedDrinkware({
            name,
            description
        });
        await createdDrinkware.validate();
        await createdDrinkware.save();

        res.status(204).send();
    } catch(err) {
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
        console.log(drinkware_id)
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
            return res.status(401).send({ path: 'drinkware_id', type: 'valid', message: 'Can not view drinkware' });

        res.status(200).send(drinkwareInfo.getBasicInfo());
    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports.uploadCover = async (req, res) => {
    try {
        const { drinkware_id } = req.body;
        const drinkware_cover = req.file;

        if (!drinkware_cover)
            return res.status(400).send({ path: 'image', type: 'exist', message: 'No image was uploaded' });
        
        const filepath = '/' + drinkware_cover.destination + drinkware_cover.filename;
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
        
        if (drinkwareInfo.cover)
            await fileOperations.deleteSingle(drinkwareInfo.cover);
        drinkwareInfo.cover = filepath;
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
            searchConditions = searchConditions.where({ $or: [{ model: 'Verified Drinkware' },{ user: req.user._id },{ privacy: 'public' }] });
        else
            searchConditions = searchConditions.where({ model: 'Verified Drinkware' },{ privacy: 'public' });
            
        res.status(200).send(await searchConditions);
    } catch(err) {
        res.status(500).send(err);
    }
}
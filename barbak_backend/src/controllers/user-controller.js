const fileOperations = require('../utils/file-operations');
const User = require('../models/user-model');
const mongoose = require('mongoose');
const { subject } = require('@casl/ability');

module.exports.clientInfo = async (req, res) => {
    try {
        const userInfo = await User.findOne({ _id: req.user._id });
        res.status(200).send(userInfo.getPersonalUserInfo());
    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports.getUser = async (req, res) => {
    try {
        const { user_id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(user_id))
            return res.status(401).send({ path: 'user_id', type: 'valid', message: 'Invalid user ID' });
    
        const userInfo = await User.findOne({ _id: user_id });
        if (!userInfo)
            return res.status(401).send({ path: 'user_id', type: 'exist', message: 'User does not exist' });
        else if (!req.ability.can('read', subject('users', userInfo)))
            return res.status(401).send({ path: 'user_id', type: 'valid', message: 'Can not view user' });

        res.status(200).send(userInfo.getBasicUserInfo());
    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports.uploadProfileImage = async (req, res) => {
    try {
        const upload = req.file || null;
        if (!upload)
            return res.status(400).send({ path: 'upload', type: 'valid', message: 'Image was not provided' });
        
        const userInfo = await User.findOne({ _id: req.user._id });
        const filepath = '/' + upload.destination + upload.filename;

        if (userInfo.profile_image) {
            try {
                await fileOperations.deleteSingle(userInfo.profile_image);
            } catch(err) {
                console.log(err);
            }
        }
            
        userInfo.profile_image = filepath;
        await userInfo.save();
        res.status(204).send();
    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports.changeUsername = async (req, res) => {
    try {
        const { username } = req.body;
        if (await User.exists({ username }))
            return res.status(400).send({ path: 'username', type: 'exist', message: 'Username is already associated with another account' });
        
        await User.findOneAndUpdate({ _id: req.user._id },{ username });
        res.status(204).send();
    } catch(err) {
        res.status(500).send(err);
    }
}
const fileOperations = require('../utils/file-operations');
const User = require('../models/user-model');
const { subject } = require('@casl/ability');

module.exports.clientInfo = async (req, res) => {
    try {
        const userInfo = await User.findOne({ _id: req.user._id });
        res.status(200).send(userInfo.basicStripExcess());
    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports.getUser = async (req, res) => {
    try {
        const { user_id } = req.params;
        const userInfo = await User.findOne({ _id: user_id });
        if (!userInfo)
            return res.status(404).send({ path: 'user_id', type: 'exist', message: 'User does not exist' });
        else if (!req.ability.can('read', subject('users', userInfo)))
            return res.status(403).send({ path: 'user_id', type: 'valid', message: 'Can not view user' });

        res.status(200).send(userInfo.extendedStripExcess());
    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports.uploadProfileImage = async (req, res) => {
    try {
        const profileImage = req.file;
        if (!profileImage)
            return res.status(400).send({ path: 'image', type: 'exist', message: 'Imange was not provided' });
        
        const userInfo = await User.findOne({ _id: req.user._id });
        const filepath = await fileOperations.moveSingle(profileImage.path, './assets/public/images');

        if (userInfo.profile_image)
            await fileOperations.deleteSingle(userInfo.profile_image);
        
        userInfo.profile_image = filepath;
        await userInfo.save();
        res.status(204).send();
    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports.removeProfileImage = async (req, res) => {
    try {
        const userInfo = await User.findOne({ _id: req.user._id });
        if (!userInfo.profile_image)
            return res.status(404).send({ path: 'image', type: 'exist', message: 'Account has no profile image' });
        
        await fileOperations.deleteSingle(userInfo.profile_image);
        userInfo.profile_image = null;
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
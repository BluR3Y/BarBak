const User = require('../models/user-model');
const { ForbiddenError: CaslError, subject } = require('@casl/ability');
const s3Operations = require('../utils/aws-s3-operations');
const AppError = require('../utils/app-error');
const fileOperations = require('../utils/file-operations');
const responseObject = require('../utils/response-object');

module.exports.uploadProfileImage = async (req, res, next) => {
    try {
        const profileImage = req.file;
        if (!profileImage)
            throw new AppError(400, 'MISSING_REQUIRED_FILE', 'No image was uploaded');
        
        const userInfo = await User.findById(req.user._id);
        CaslError.from(req.ability)
            .setMessage('Unauthorized to modify user profile')
            .throwUnlessCan('update', subject('users', { document: userInfo }));

        const [uploadInfo] = await Promise.all([
            s3Operations.createObject(profileImage, 'avatars'),
            ...(userInfo.profile_image ? [s3Operations.removeObject(userInfo.profile_image)] : [])
        ]);
        userInfo.profile_image = uploadInfo.filepath;
        await userInfo.save();
        res.status(204).send();
    } catch(err) {
        next(err);
    } finally {
        if (req.file) {
            fileOperations.deleteSingle(req.file.path)
            .catch(err => console.error(err));
        }
    }
}

module.exports.removeProfileImage = async (req, res, next) => {
    try {
        const userInfo = await User.findById(req.user._id);
        CaslError.from(req.ability)
            .setMessage('Unauthorized to modify user profile')
            .throwUnlessCan('update', subject('users', { document: userInfo }));

        if (!userInfo.profile_image)
            throw new AppError(404, 'NOT_FOUND', 'Account has no profile image');
        
        await s3Operations.removeObject(userInfo.profile_image);
        userInfo.profile_image = null;
        await userInfo.save();
        res.status(204).send();
    } catch(err) {
        next(err);
    }
}

module.exports.changeUsername = async (req, res, next) => {
    try {
        const { username } = req.body;
        const userInfo = await User.findById(req.user._id);
        CaslError.from(req.ability)
            .setMessage('Unauthorized to modify user profile')
            .throwUnlessCan('update', subject('users', { document: userInfo }));

        userInfo.set({username});
        await userInfo.save();
        res.status(204).send();
    } catch(err) {
        next(err);
    }
}

module.exports.getUser = async (req, res, next) => {
    try {
        const { user_id, privacy_type = 'public' } = req.params;
        const userInfo = await User.findById(user_id);
        
        if (!userInfo)
            throw new AppError(404, 'NOT_FOUND', 'User does not exist');
        CaslError.from(req.ability)
            .setMessage('Unauthorized to view user profile')
            .throwUnlessCan('read', subject('users', { action_type: privacy_type, document: userInfo }));

        const response = await responseObject(userInfo, [
            { name: '_id', alias: 'id' },
            { name: 'username' },
            { name: 'fullname' },
            { name: 'expertise_level' }
        ]);
        res.status(200).send(response);
    } catch(err) {
        next(err);
    }
}

module.exports.clientInfo = async (req, res, next) => {
    try {
        const userInfo = await User.findById(req.user._id);
        const response = await responseObject(userInfo, [
            { name: '_id', alias: 'id' },
            { name: 'username' },
            { name: 'fullname' },
            { name: 'email' },
            { name: 'expertise_level' },
            { name: 'role_info', parent_fields: [
                { name: 'name', alias: 'role' }
            ] },
            { name: 'date_registered' }
        ]);
        res.status(200).send(response);
    } catch(err) {
        next(err);
    }
}
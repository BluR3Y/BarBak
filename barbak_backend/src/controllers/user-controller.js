const User = require('../models/user-model');
const { ForbiddenError: CaslError, subject } = require('@casl/ability');
const s3Operations = require('../utils/aws-s3-operations');
const { UserAssetControl } = require('../models/file-access-control-model');
const AppError = require('../utils/app-error');
const fileOperations = require('../utils/file-operations');
const responseObject = require('../utils/response-object');

module.exports.uploadProfileImage = async (req, res, next) => {
    try {
        const profileImage = req.file;
        if (!profileImage)
            throw new AppError(400, 'MISSING_REQUIRED_FILE', 'No image was uploaded');
        CaslError.from(req.ability)
            .setMessage('Unauthorized to create asset')
            .throwUnlessCan('create', subject('assets', { subject_type: 'user' }));

        const userInfo = await User.findById(req.user._id);
        CaslError.from(req.ability)
            .setMessage('Unauthorized to modify user profile')
            .throwUnlessCan('update', subject('users', { document: userInfo }));

        if (userInfo.profile_image) {
            const aclDocument = await UserAssetControl.findById(userInfo.profile_image);
            CaslError.from(req.ability)
                .setMessage('Unauthorized to modify asset')
                .throwUnlessCan('delete', subject('assets', { document: aclDocument }));

            await s3Operations.removeObject(aclDocument.file_path);
        }

        const uploadInfo = await s3Operations.createObject(profileImage, 'assets/users/images');
        const createdACL = new UserAssetControl({
            file_name: uploadInfo.filename,
            file_size: profileImage.size,
            mime_type: profileImage.mimetype,
            file_path: uploadInfo.filepath,
            user: req.user._id,
            public: true
        });
        await createdACL.save();
        userInfo.profile_image = createdACL._id;
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
        if (!userInfo.profile_image)
            throw new AppError(404, 'NOT_FOUND', 'Account has no profile image');
        CaslError.from(req.ability)
            .setMessage('Uauthorized to modify user profile')
            .throwUnlessCan('update', subject('users', { document: userInfo }));
        
        const aclDocument = await UserAssetControl.findById(userInfo.profile_image);
        CaslError.from(req.ability)
            .setMessage('Unauthorized to delete asset')
            .throwUnlessCan('delete', subject('assets', { document: aclDocument }));

        await Promise.all([
            s3Operations.removeObject(aclDocument.file_path),
            aclDocument.remove()
        ]);
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
            { name: 'profile_image_url' },
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
            { name: 'profile_image_url' },
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
const fileOperations = require('../utils/file-operations');
const User = require('../models/user-model');
const { subject } = require('@casl/ability');
const s3Operations = require('../utils/aws-s3-operations');
const FileAccessControl = require('../models/file-access-control-model');
const AppError = require('../utils/app-error');
const responseObject = require('../utils/response-object');

module.exports.uploadProfileImage = async (req, res, next) => {
    try {
        const profileImage = req.file;
        if (!profileImage)
            throw new AppError(400, 'MISSING_REQUIRED_FILE', 'No image was uploaded');
        
        const userInfo = await User.findOne({ _id: req.user._id });
        if (userInfo.profile_image) {
            const aclDocument = await FileAccessControl.findOne({ _id: userInfo.profile_image });
            if (!aclDocument.authorize('update', { user: req.user }))
                throw new AppError(403, 'FORBIDDEN', 'Unauthorized to modify user profile image');

            const [,uploadInfo] = await Promise.all([
                s3Operations.removeObject(aclDocument.file_path),
                s3Operations.createObject(profileImage, 'assets/users/images')
            ]);

            aclDocument.set({
                file_name: uploadInfo.filename,
                file_size: profileImage.size,
                mime_type: profileImage.mimetype,
                file_path: uploadInfo.filepath
            });
            await aclDocument.save();
        } else {
            const uploadInfo = await s3Operations.createObject(profileImage, 'assets/users/images');
            const createdACL = new FileAccessControl({
                file_name: uploadInfo.filename,
                file_size: profileImage.size,
                mime_type: profileImage.mimetype,
                file_path: uploadInfo.filepath,
                permissions: [
                    { action: 'manage', conditions: { 'user._id': req.user._id } },
                    ...(userInfo.public ? [{ action: 'read' }] : [])
                ]
            });
            await createdACL.save();
            userInfo.profile_image = createdACL._id;
        }
        await userInfo.save();
        res.status(204).send();
    } catch(err) {
        next(err);
    } finally {
        fileOperations.deleteSingle(req.file.path)
        .catch(err => console.error(err));
    }
}

// module.exports.removeProfileImage = async (req, res) => {
//     try {
//         const userInfo = await User.findOne({ _id: req.user._id });
//         if (!userInfo.profile_image)
//             return res.status(404).send({ path: 'image', type: 'exist', message: 'Account has no profile image' });
        
//         await s3Operations.removeObject(userInfo.profile_image);
//         userInfo.profile_image = null;
//         await userInfo.save();
//         res.status(204).send();
//     } catch(err) {
//         console.error(err);
//         res.status(500).send('Internal server error');
//     }
// }

module.exports.removeProfileImage = async (req, res, next) => {
    try {
        const userInfo = await User.findOne({ _id: req.user._id });
        if (!userInfo.profile_image)
            throw new AppError(400, 'INVALID_ARGUMENT', 'Account has no profile image');
        
        // Last Here
    } catch(err) {
        next(err);
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
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

module.exports.getUser = async (req, res, next) => {
    try {
        const { user_id, privacy_type = 'public' } = req.params;
        const userInfo = await User.findOne({ _id: user_id });

        if (!userInfo)
            throw new AppError(404, 'NOT_FOUND', 'User does not exist');
        else if (!req.ability.can('read', subject('users', { action_type: privacy_type, document: userInfo })))
            throw new AppError(403, 'FORBIDDEN', 'Unauthorized to view user');
        console.log(userInfo)
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

module.exports.clientInfo = async (req, res) => {
    try {
        const userInfo = await User.findOne({ _id: req.user._id });

        res.status(200).send(Object.assign({
            id: userInfo._id,
            username: userInfo.username,
            fullname: userInfo.fullname,
            email: userInfo.email,
            profile_image: userInfo.profile_image_url,
            expertise_level: userInfo.expertise_level,
            date_registered: userInfo.date_registered
        }));
    } catch(err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
}
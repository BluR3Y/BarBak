const User = require('../models/user-model');
const { ForbiddenError: CaslError, subject } = require('@casl/ability');
const { permittedFieldsOf } = require('@casl/ability/extra');
const s3Operations = require('../utils/aws-s3-operations');
const AppError = require('../utils/app-error');
const fileOperations = require('../utils/file-operations');
const responseObject = require('../utils/response-object');

// Joi validation should validate fields
module.exports.modifyClientInfo = async (req, res, next) => {
    try {
        const userInfo = await User.findById(req.user._id);
        if (!Object.keys(req.body).every(field => req.ability.can('update', subject('users', { document: userInfo }), field)))
            throw new CaslError().setMessage('Unauthorized to modify user profile');

        userInfo.set(req.body);
        if (req.file) {
            const uploadInfo = await s3Operations.createObject(req.file, 'assets/users/images/profile');
            userInfo.profile_image = uploadInfo.filepath;
        }
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

module.exports.getUser = async (req, res, next) => {
    try {
        const { user_id } = req.params;
        const userInfo = await User.findById(user_id);

        if (!userInfo)
            throw new AppError(404, 'NOT_FOUND', 'User does not exist');
        CaslError.from(req.ability)
            .setMessage('Unauthorized to view user profile')
            .throwUnlessCan('read', subject('users', { document: userInfo }));

        const response = await responseObject(userInfo, [
            { name: '_id', alias: 'id' },
            { name: 'username' },
            { name: 'fullname' },
            { name: 'email' },
            { name: 'about_me' },
            { name: 'experience' },
            { name: 'achievements' },
            { name: 'education' },
            { name: 'skills' },
            { name: 'interests' },
            { name: 'public' },
            { name: 'expertise_level' },
            { name: 'role_info', alias: 'role' },
            { name: 'date_registered' },
        ], permittedFieldsOf(req.ability, 'read', subject('users', { document: userInfo }), { fieldsFrom: rule => rule.fields || [] }));
        res.status(200).send(response);
    } catch(err) {
        next(err);
    }
}

module.exports.getProfileImage = async (req, res, next) => {
    try {
        const { user_id } = req.params;
        const userInfo = await User.findById(user_id);
        
        if (!userInfo)
            throw new AppError(404, 'NOT_FOUND', 'User does not exist');
        CaslError.from(req.ability)
            .setMessage('Unauthorized to view user profile')
            .throwUnlessCan('read', subject('users', { document: userInfo }), 'profile_image');

        if (!userInfo.profile_image)
            throw new AppError(404, 'NOT_FOUND', 'User does not have a profile image');

        const fileData = await s3Operations.getObject(userInfo.profile_image);
        res.setHeader('Content-Type', fileData.ContentType);
        res.send(fileData.Body);
    } catch(err) {
        next(err);
    }
}

module.exports.getClientInfo = async (req, res, next) => {
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
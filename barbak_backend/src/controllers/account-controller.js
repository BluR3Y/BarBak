const User = require('../models/user-model');
const auth = require('../lib/auth');
const encryptionOperations = require('../utils/encryption-operations');
const AppError = require('../utils/app-error');
const responseObject = require('../utils/response-object');

module.exports.login = auth.authenticate.localLogin;

module.exports.logout = async (req, res, next) => {
    req.session.destroy((err) => {
        if (err)
            return next(new Error('Internal server error'));
        res.status(204).send();
    });
}

module.exports.register = async (req, res, next) => {
    try {
        const { fullname, email, password } = req.body;

        if (await User.exists({ email }))
            throw new AppError(409, 'ALREADY_EXIST', 'Email is already associated with another account');
        
        const { encryptionKey, iv, encryptedData } = encryptionOperations.encrypt(JSON.stringify({ fullname, email, password }));
        req.session.verifiedAccount = false;
        req.session.encryptedRegistrationInfo = encryptedData;
        req.session.registrationInfoEncryptionKey = encryptionKey;
        req.session.registrationInfoIV = iv;

        await User.sendRegistrationCode(req.sessionID, email);
        res.status(204).send();
    } catch(err) {
        next(err);
    }
}

module.exports.resendRegistrationCode = async (req, res, next) => {
    try {
        const { verifiedAccount } = req.session;
        if (typeof verifiedAccount === 'undefined')
            throw new AppError(404, 'NOT_FOUND', 'Registration process has not been initialized');
        else if (verifiedAccount)
            throw new AppError(403, 'FORBIDDEN', 'Registration code has already been provided');

        const { registrationInfoEncryptionKey, registrationInfoIV, encryptedRegistrationInfo } = req.session;
        const decryptedData = encryptionOperations.decrypt(registrationInfoEncryptionKey, registrationInfoIV, encryptedRegistrationInfo);
        const registrationInfo = JSON.parse(decryptedData);

        await User.sendRegistrationCode(req.sessionID, registrationInfo.email);
        res.status(204).send();
    } catch(err) {
        next(err);
    }
}

module.exports.validateRegistrationCode = async (req, res, next) => {
    try {
        const { verifiedAccount } = req.session;
        if (typeof verifiedAccount === 'undefined')
            throw new AppError(404, 'NOT_FOUND', 'Registration process has not been initialized');
        else if (verifiedAccount)
            throw new AppError(403, 'FORBIDDEN', 'Registration code has already been provided');

        const { registration_code } = req.params;
        if (!await User.validateRegistrationCode(req.sessionID, registration_code))
            throw new AppError(400, 'INVALID_ARGUMENT', 'Registration code is invalid');
        
        req.session.verifiedAccount = true;
        res.status(204).send();    
    } catch(err) {
        next(err);
    }
}

module.exports.usernameSelection = async (req, res, next) => {
    try {
        const { verifiedAccount } = req.session;
        if (typeof verifiedAccount === 'undefined')
            throw new AppError(404, 'NOT_FOUND', 'Registration process has not been initialized');
        else if (!verifiedAccount)
            throw new AppError(403, 'FORBIDDEN', 'Registration code has not been provided');

        const { registrationInfoEncryptionKey, registrationInfoIV, encryptedRegistrationInfo } = req.session;
        const decryptedData = encryptionOperations.decrypt(registrationInfoEncryptionKey, registrationInfoIV, encryptedRegistrationInfo);
        const { fullname, email, password } = JSON.parse(decryptedData);
        const hashedPassword = await User.hashPassword(password);

        const createdUser = new User({
            ...req.body,
            fullname,
            email,
            password: hashedPassword
        });
        await createdUser.validate();
        await createdUser.save();
        
        delete req.session.verifiedAccount;
        delete req.session.encryptedRegistrationInfo;
        delete req.session.registrationInfoEncryptionKey;
        delete req.session.registrationInfoIV;

        req.logIn(createdUser, (err) => {
            if (err)
                throw new Error('Internal server error');
            responseObject(createdUser, [
                { name: '_id', alias: 'id' },
                { name: 'username' },
                { name: 'profile_image_url', alias: 'profile_image' },
                { name: 'role_info', alias: 'role' },
                { name: 'public' },
                { name: 'expertise_level' }
            ])
            .then(response => res.status(200).send(response));
        });
    } catch(err) {
        next(err);
    }
}

module.exports.togglePrivacy = async (req, res, next) => {
    try {
        await User.findOneAndUpdate(
            { _id: req.user._id },
            [ { $set: { public: { $not: "$public" } } } ]
        );
        res.status(204).send();
    } catch(err) {
        next(err);
    }
}
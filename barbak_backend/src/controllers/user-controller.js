const FileOperations = require('../utils/file-operations');
const User = require('../models/user-model');
const auth = require('../middleware/auth');
const ACL = require('../models/file-access-control');

module.exports.testACL = async (req, res) => {
    const created = new ACL({
        file_name: 'tester.jpg',
        mime_type: 'image/jpg',
        file_path: '/assets/private/images/',
        file_size: '100',
        user_id: req.user._id,
    })
    await created.save();
    res.send(created)
}

module.exports.register = async (req, res) => {
    try {
        const { fullname, email, password } = req.body;

        if (await User.findOne({ email }))
            return res.status(400).send({ path: 'email', type: 'exist', message: 'Email is already associated with another account' });

        const { encryptionKey, iv, encryptedData } = User.encryptData(JSON.stringify({ fullname, email, password }));
        req.session.verifiedAccount = false;
        req.session.encryptedRegistrationInfo = encryptedData;
        req.session.registrationInfoEncryptionKey = encryptionKey;
        req.session.registrationInfoIV = iv;

        await User.sendRegistrationCode(req.sessionID, email);

        res.status(204).send();
    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports.resendRegistrationCode = async (req, res) => {
    try {
        const { verifiedAccount } = req.session;
        if (verifiedAccount === undefined)
            return res.status(401).send({ path: 'registration', type: 'exist', message: 'Registration process has not been initialized' });
        else if (verifiedAccount === true)
            return res.status(401).send({ path: 'registration', type: 'valid', message: 'Registration code has already been provided' });

        const { registrationInfoEncryptionKey, registrationInfoIV, encryptedRegistrationInfo } = req.session;
        const decryptedData = User.decryptData(registrationInfoEncryptionKey, registrationInfoIV, encryptedRegistrationInfo);
        const registrationInfo = JSON.parse(decryptedData);

        await User.sendRegistrationCode(req.sessionID, registrationInfo.email);

        res.status(204).send();
    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports.validateRegistrationCode = async (req, res) => {
    try {
        const { verifiedAccount } = req.session;
        if (verifiedAccount === undefined)
            return res.status(401).send({ path: 'registration', type: 'exist', message: 'Registration process has not been initialized' });
        else if (verifiedAccount === true)
            return res.status(401).send({ path: 'registration', type: 'valid', message: 'Registration code has already been provided' });

        const { registration_code } = req.body;
        if (!await User.validateRegistrationCode(req.sessionID, registration_code))
            return res.status(401).send({ path: 'code', type: 'valid', message: 'Registration Code is invalid' });
        req.session.verifiedAccount = true;

        res.status(204).send();
    } catch(err) {
        res.send(500).send(err);
    }
}

module.exports.usernameSelection = async (req, res) => {
    try {
        const { verifiedAccount } = req.session;
        if (verifiedAccount === undefined)
            return res.status(401).send({ path: 'registration', type: 'exist', message: 'Registration process has not been initialized' });
        else if (verifiedAccount === false)
            return res.status(401).send({ path: 'registration', type: 'valid', message: 'Registration code has not been provided' });

        const { username } = req.body;
        if (await User.findOne({ username }))
            return res.status(400).send({ path: 'username', type: 'exist', message: 'Username is already associated with another account' });
        
        const { registrationInfoEncryptionKey, registrationInfoIV, encryptedRegistrationInfo } = req.session;
        const decryptedData = User.decryptData(registrationInfoEncryptionKey, registrationInfoIV, encryptedRegistrationInfo);
        const { fullname, email, password } = JSON.parse(decryptedData);
        const hashedPassword = await User.hashPassword(password);

        const createdUser = new User({
            username,
            email,
            fullname,
            password: hashedPassword
        });
        await createdUser.validate();
        await createdUser.customValidate();
        await createdUser.save();

        delete req.session.verifiedAccount;
        delete req.session.encryptedRegistrationInfo;
        delete req.session.registrationInfoEncryptionKey;
        delete req.session.registrationInfoIV;

        await new Promise((resolve, reject) => {
            req.logIn(createdUser, (err) => {
                if (err) return reject(err);
                resolve();
            })
        });
        res.status(200).send(createdUser.getBasicUserInfo());
    } catch(err) {
        if (err.name === "ValidationError" || err.name === "CustomValidationError") {
            var errors = [];
            
            Object.keys(err.errors).forEach(error => {
                const errorParts = error.split('.');
                const errorPart = errorParts[0];
                const indexPart = errorParts[1] || '0';
                
                errors.push({ 
                    path: errorPart, 
                    type: (err.name === "ValidationError") ? err.errors[error].properties.type : err.errors[error], 
                    index: indexPart 
                });
            })
            return res.status(400).send(errors);
        }
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
                await FileOperations.deleteSingle(userInfo.profile_image);
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

// Authenticate the user via email and password input fields
module.exports.login = auth.authenticate.localLogin;

module.exports.checkSession = (req, res) => {
    if (!req.isAuthenticated())
        return res.status(401).send({ path: 'user', type: 'authenticated' });

    res.status(200).send(req.user.getBasicUserInfo());
}

module.exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) 
            return res.status(500).send(err);
        res.status(204).send();
    })
};
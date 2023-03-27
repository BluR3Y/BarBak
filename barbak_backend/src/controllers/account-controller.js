const User = require('../models/user-model');
const auth = require('../lib/auth');
const encryptionOperations = require('../utils/encryption-operations');

module.exports.login = auth.authenticate.localLogin;

module.exports.logout = async (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Internal server error');
        }
        res.status(204).send();
    });
}

module.exports.register = async (req, res) => {
    try {
        const { fullname, email, password } = req.body;

        if (await User.exists({ email }))
            return res.status(400).send({ path: 'email', type: 'exist', message: 'Email is already associated with another account' });
        
        const { encryptionKey, iv, encryptedData } = encryptionOperations.encrypt(JSON.stringify({ fullname, email, password }));
        req.session.verifiedAccount = false;
        req.session.encryptedRegistrationInfo = encryptedData;
        req.session.registrationInfoEncryptionKey = encryptionKey;
        req.session.registrationInfoIV = iv;

        await User.sendRegistrationCode(req.sessionID, email);
        res.status(204).send();
    } catch(err) {
        console.error(err);
        res.status(500).send('Internal server error');
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
        const decryptedData = encryptionOperations.decrypt(registrationInfoEncryptionKey, registrationInfoIV, encryptedRegistrationInfo);
        const registrationInfo = JSON.parse(decryptedData);

        await User.sendRegistrationCode(req.sessionID, registrationInfo.email);
        res.status(204).send();
    } catch(err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

module.exports.validateRegistrationCode = async (req, res) => {
    try {
        const { verifiedAccount } = req.session;
        if (verifiedAccount === undefined)
            return res.status(401).send({ path: 'registration', type: 'exist', message: 'Registration process has not been initialized' });
        else if (verifiedAccount === true)
            return res.status(401).send({ path: 'registration', type: 'valid', message: 'Registration code has already been provided' });

        const { registration_code } = req.params;
        if (!await User.validateRegistrationCode(req.sessionID, registration_code))
            return res.status(401).send({ path: 'code', type: 'valid', message: 'Registration Code is invalid' });
        req.session.verifiedAccount = true;

        res.status(204).send();
    } catch(err) {
        console.error(err);
        res.status(500).send('Internal server error');
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
        const decryptedData = encryptionOperations.decrypt(registrationInfoEncryptionKey, registrationInfoIV, encryptedRegistrationInfo);
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

        req.logIn(createdUser, (err) => {
            if (err)
                throw err;
            res.status(200).send(createdUser.basicStripExcess());
        });
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
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

module.exports.togglePrivacy = async (req, res) => {
    try {
        await User.findOneAndUpdate({ _id: req.user._id },{ privacy: req.user.privacy === 'private' ? 'public' : 'private' });
        res.status(204).send();
    } catch(err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
}
const FileOperations = require('../utils/file-operations');
const NodeMailerOperations = require('../utils/nodemailer-operations');

const User = require('../models/user-model');
const auth = require('../auth');

module.exports.test = async (req, res) => {
    console.log(req.session)
    console.log(req.user)

    res.send('TEST');
}

module.exports.testUploads = async (req,res) => {
    console.log(req.file)
    res.send('Test')
}

module.exports.testDownloads = async (req, res) => {
    try {
        const { filename } = req.body;

        const image = await FileOperations.readSingle('assets/images/', filename)
        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
        res.end(image, 'binary');
    } catch (err) {
        res.status(500).send(err);
    }
}

module.exports.testNodeMailer = async (req, res) => {
    const mailerRes = await NodeMailerOperations.tester('reyhector1234@gmail.com');
    console.log(mailerRes);

    res.status(200).send('hello')
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

        res.status(200).send(createdUser.getPublicInfo());
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

// Steps:
    // 1. client: enters registration info: username, password, etc ; server: validates email availability and temporarily stores info in redis
    // 2: User provides verification code sent to email address ; server: validates verification code 
    // 3: User provides a username and optionally a profile image ; server: validates username availability and image 

// module.exports.register = async (req, res) => {
//     try {
//         const { username, email, fullname, password } = req.body;
//         const hashedPassword = await User.hashPassword(password);

//         const createdUser = new User({
//             username,
//             email,
//             fullname,
//             password: hashedPassword
//         });
//         await createdUser.validate();
//         await createdUser.customValidate();
//         await createdUser.save();

//         // to do: 1. generate verification code, store code

//         // temporary res
//         res.status(204).send();
//     } catch(err) {
//         if (err.name === "ValidationError" || err.name === "CustomValidationError") {
//             var errors = [];
            
//             Object.keys(err.errors).forEach(error => {
//                 const errorParts = error.split('.');
//                 const errorPart = errorParts[0];
//                 const indexPart = errorParts[1] || '0';
                
//                 errors.push({ 
//                     path: errorPart, 
//                     type: (err.name === "ValidationError") ? err.errors[error].properties.type : err.errors[error], 
//                     index: indexPart 
//                 });
//             })
//             return res.status(400).send(errors);
//         }
//         return res.status(500).send(err);
//     }
// }

// Authenticate the user via email and password input fields
module.exports.login = auth.authenticate.localLogin;

module.exports.checkSession = (req, res) => {
    if (!req.isAuthenticated())
        return res.status(401).send({ path: 'user', type: 'authenticated' });
        
    const { _id, username, email, profile_image, experience } = req.user;
    const userInfo = {
        userId: _id,
        username,
        email,
        profile_image,
        experience
    };
    res.status(200).send(userInfo);
}

module.exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) 
            return res.status(500).send(err);
        res.status(204).send();
    })
};
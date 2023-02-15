const FileOperations = require('../utils/file-operations');

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
        return res.status(500).send(err);
    }
}

module.exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await User.hashPassword(password)
        
        const createdUser = new User({
            username,
            email,
            password: hashedPassword
        });
        await createdUser.validate();
        await createdUser.customValidate();

        const uploadInfo = req.file ? await FileOperations.uploadSingle('assets/images/', req.file) : null;
        createdUser.profile_image = uploadInfo ? uploadInfo.filename : null;

        await createdUser.save();
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
        return res.status(500).send(err);
    }
    res.status(204).send();
}

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
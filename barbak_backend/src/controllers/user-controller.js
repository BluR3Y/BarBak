const FileOperations = require('../utils/file-operations');

const User = require('../models/user-model');
const auth = require('../auth');

module.exports.test = async (req, res) => {
    res.send('TEST');
}

module.exports.testUploads = async (req,res) => {
    console.log(req.file)
    res.send('Test')
}

module.exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        const createdUser = new User({
            username,
            email,
            password
        });
        await createdUser.validate();
        await createdUser.customValidate();

        const uploadInfo = req.file ? await FileOperations.uploadSingle('assets/users/', req.file) : null;
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

module.exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) 
            return res.status(500).send(err);
        res.status(204).send();
    })
};
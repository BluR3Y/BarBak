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
    
    const { username, email, password } = req.body;

    if(await User.exists({ username }))
        return res.status(400).send({ path: 'username', type: 'exist' });
    if(await User.exists({ email }))
        return res.status(400).send({ path: 'email', type: 'exist' });

    const hashedPassword = await User.hashPassword(password);

    try {
        const uploadInfo = req.file ? await FileOperations.uploadSingle('assets/users/', req.file) : null;

        await User.create({
            username,
            email,
            password: hashedPassword,
            profile_image: uploadInfo ? uploadInfo.filename : null,
        });
    } catch(err) {
        return res.status(500).send(err);
    }
    res.status(204).send();
};

// Authenticate the user via email and password input fields
module.exports.login = auth.authenticate.localLogin;

module.exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) 
            return res.status(500).send(err);
        res.status(204).send();
    })
};
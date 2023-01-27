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
    const profileImage = req.file;
    console.log(profileImage)
    if(await User.exists({ username }))
        return res.status(400).send({ path: 'username', type: 'exist' });
    if(await User.exists({ email }))
        return res.status(400).send({ path: 'email', type: 'exist' });

    const hashedPassword = await User.hashPassword(password);

    try {
        await User.create({
            username,
            email,
            password: hashedPassword,
            profile_image: profileImage ? profileImage.filename : null
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
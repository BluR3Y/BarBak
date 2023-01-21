const User = require('../models/user-model');
const bcrypt = require('bcrypt');
const auth = require('../auth');

module.exports.test = async (req, res) => {
    res.send('TEST');
}

module.exports.register = async (req, res) => {
    
    const { username, email, password } = req.body;

    if(await User.exists({ username }))
        return res.status(400).send({ path: 'username', type: 'exist' });
    if(await User.exists({ email }))
        return res.status(400).send({ path: 'email', type: 'exist' });

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    try {
        await User.create({
            username,
            email,
            password: hashedPassword
        });
        res.status(204).send();
    } catch(err) {
        res.status(500).send(err);
    }
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
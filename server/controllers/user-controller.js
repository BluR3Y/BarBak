const User = require('../models/user-model');
const bcrypt = require('bcrypt');
const userValidators = require('../validators/user-validators');
const auth = require('../auth');

module.exports.test = async (req, res) => {
    res.send('TEST');
}

module.exports.register = async (req, res) => {
    const validation = userValidators.registerValidator(req.body);
    
    if(validation.error) {
        const { path, type } = validation.error.details[0];
        return res.status(400).send({ path: path[0], type: type });
    }
    const { username, email, password } = validation.value;

    if(await User.exists({ username })) 
        return res.status(400).send({ path: 'username', type: 'exists' });
    
    if(await User.exists({ email }))
        return res.status(400).send({ path: 'email', type: 'exists' });

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    try {
        const registeredUser = await User.create({
            username,
            email,
            password: hashedPassword
        });
        res.status(200).send(registeredUser);
    } catch(err) {
        res.status(500).send(err);
    }
}

// Authenticate the user via email and password input fields
module.exports.login = auth.authenticate.localLogin;
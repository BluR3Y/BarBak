const User = require('../models/user-model');
const bcrypt = require('bcrypt');

module.exports.test = async (req, res) => {
    res.send('TEST');
}

module.exports.register = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const registeredUser = await User.create({ username, email, password });
        console.log(registeredUser)
    }catch(err) {
        console.log(err)
    }

    res.send('hehe');
}
const User = require('../models/user-model');
const bcrypt = require('bcrypt');
const userValidators = require('../validators/user-validators');

module.exports.test = async (req, res) => {
    res.send('TEST');
}

module.exports.register = async (req, res) => {
    const validation = userValidators.registerValidator(req.body);
    console.log(validation)

    res.send('hehea');
}
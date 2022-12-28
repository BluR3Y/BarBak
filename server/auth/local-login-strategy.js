const User = require('../models/user-model');
const bcrypt = require('bcrypt');
const localStrategy = require('passport-local').Strategy;
const userValidators = require('../validators/user-validators');

module.exports = function(passport) {
    passport.use('local-login', new localStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    },
    function(req, email, password, done) {
        const validation = userValidators.localLoginValidator({ email, password });

        if(validation.error)
            return done('error');
    }))
}
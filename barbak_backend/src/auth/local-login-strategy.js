const User = require('../models/user-model');
const bcrypt = require('bcrypt');
const localStrategy = require('passport-local').Strategy;

module.exports = function(passport) {
    passport.use('local-login', new localStrategy({
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true
    },
    async function(req, username, password, done) {

        const retrievedUser = await User.findOne({ username });
        if(!retrievedUser) 
            return done({ path: 'user', type: 'exist' });
        if(!await bcrypt.compare(password, retrievedUser.password))
            return done({ path: 'password', type: 'incorrect' });
        return done(null, retrievedUser);
    }));
}
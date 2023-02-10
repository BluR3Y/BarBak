const User = require('../models/user-model');
const localStrategy = require('passport-local').Strategy;

module.exports = function(passport) {
    passport.use('local-login', new localStrategy({
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true
    },
    async function(req, username, password, done) {

        const retrievedUser = await User.findOne({ $or: [ { username }, { email: username } ] });
        if(!retrievedUser) 
            return done({ path: 'user', type: 'exist' });
        if(!await retrievedUser.validatePassword(password))
            return done({ path: 'password', type: 'incorrect' });
        return done(null, retrievedUser);
    }));
}
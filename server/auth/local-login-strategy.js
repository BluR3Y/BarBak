const User = require('../models/user-model');
const bcrypt = require('bcrypt');
const localStrategy = require('passport-local').Strategy;

module.exports = function(passport) {
    passport.use('local-login', new localStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    },
    async function(req, email, password, done) {
        const validation = User.localLoginValidator({ email, password })
        
        if(validation.error) {
            const { path, type } = validation.error.details[0];
            return done({ path: path[0], type });
        }

        const retrievedUser = await User.findOne({ email });
        if(!retrievedUser) 
            return done({ path: 'user', type: 'exists' });
        if(!await bcrypt.compare(password, retrievedUser.password))
            return done({ path: 'password', type: 'incorrect' });
        return done(null, retrievedUser);
    }));
}
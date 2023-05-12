const User = require('../../models/user-model');
const AppError = require('../../utils/app-error');
const localStrategy = require('passport-local').Strategy;

module.exports = function(passport) {
    passport.use('local-login', new localStrategy({
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true
    },
    async function(req, username, password, done) {
        const retrievedUser = await User.findOne({ $or: [ { username }, { email: username } ] });
        if (!retrievedUser)
            return done(new AppError(404, 'NOT_FOUND', 'User does not exist'));
        else if (!await retrievedUser.validatePassword(password))
            return done(new AppError(401, 'FORBIDDEN', 'Invalid credentials'));
        done(null, retrievedUser);
    }));
}
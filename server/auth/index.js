const passport = require('passport');
const User = require('../models/user-model');

// Login Strategies:
const localLogin = require('./local-login-strategy');


///////////////////////////////////////////////////////////
// Keep configuration localized here instead of server.js
//
// Set up Auth middleware
//////////////////////////////////////
exports.configureMiddleware = function(app) {
    // Used to serialize the user for the session
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    // Used to deserialize the user
    passport.deserializeUser(function (id, done) {
        User.findById(id, done);
    });

    // Install Login Strategies:
    localLogin(passport);

    app.use(passport.initialize());
    app.use(passport.session());
};

// Pass Through the Auth routes:
exports.authenticate = {
    // Email/Password:
    localLogin: async function(req, res, next) {
        return passport.authenticate('local-login', (err, user, info) => {
            console.log('marker')
        })(req, res, next);
    }
}
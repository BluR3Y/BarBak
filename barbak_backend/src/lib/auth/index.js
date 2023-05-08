const passport = require('passport');
const User = require('../../models/user-model');
const AppError = require('../../utils/app-error');
const responseObject = require('../../utils/response-object');

// Login Strategies:
const localLogin = require('./local-login-strategy');


// Set up Auth middleware
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
        return passport.authenticate('local-login', authenticationStrategyCallback(req, res, next))(req, res, next);
    }
}

function authenticationStrategyCallback(req, res, next) {
    return (err, user, info) => {
        if (err)
            return next(new AppError(400, 'INVALID_ARGUMENT', 'Invalid login credentials'));
        req.logIn(user, function(err) {
            if (err)
                return next(new Error('Internal server error'));
            responseObject(user, [
                { name: '_id', alias: 'id' },
                { name: 'username' },
                { name: 'profile_image_url', alias: 'profile_image' },
                { name: 'role_info', parent_fields: [
                    { name: 'name', alias: 'role' }
                ] },
                { name: 'public' },
                { name: 'expertise_level' }
            ])
            .then(response => {
                res.status(200).send(response);
            });
        })
    }
}

// Middleware that checks if session exists
exports.sessionAuthenticationRequired = function(req, res, next) {
    if(!req.isAuthenticated())
        throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized request');
    next();
}
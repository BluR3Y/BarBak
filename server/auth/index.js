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
            if(err)
                return res.status(400).send(err);
            else if(!user)
                return res.status(500).send("An error occured while processing your request");
            
            req.logIn(user, err => {
                if (err) throw err;
                res.status(204).send();
            })
        })(req, res, next);
    }
};

// Middleware that checks if session exists
exports.authenticationRequired = function(req, res, next) {
    if(!req.isAuthenticated())
        return res.status(401).send('Not Authenticated');
    next();
}

exports.getUser = function(req, res, next) {
    // console.log(req.session)
    // console.log(req.user)
    next();
}
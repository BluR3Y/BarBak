const express = require('express');
const path = require('path');
const auth = require('./auth');

const publicDir = path.join(__dirname, '../../assets/public');
const privateDir = path.join(__dirname, '../../assets/private');

exports.configureMiddleware = function(app) {
    app.use('/assets/public', express.static(publicDir));
    app.use('/assets/private', auth.sessionAuthenticationRequired, express.static(privateDir));
}
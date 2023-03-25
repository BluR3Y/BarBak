const assetController = require('../controllers/asset-controller');
const express = require('express');
const joiValidator = require('../middlewares/joi_validator');

module.exports.connect = function(router) {
    router.use('/assets/default', express.static('static/default'));
    router.get('/assets/public/:file_type/:file_name', assetController.public);
    router.get('/assets/private/:file_id', joiValidator, assetController.private);
}
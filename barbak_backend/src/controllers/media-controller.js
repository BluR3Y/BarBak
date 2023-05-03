const { ForbiddenError: CaslError, subject } = require('@casl/ability');
const s3Operations = require('../utils/aws-s3-operations');
const AppError = require('../utils/app-error');
const mongoose = require('mongoose');
const express = require('express');

module.exports.embeded = express.static('static/default');

module.exports.resourceCover = async (req, res, next) => {
    try {
        const { resource_type, document_id } = req.params;
        var documentModel;
        switch (true) {
            case resource_type === 'drinkware':
                documentModel = 'Drinkware';
                break;
            case resource_type === 'ingredients':
                documentModel = 'Ingredient';
                break;
            case resource_type === 'tools':
                documentModel = 'Tool';
                break;
            case resource_type === 'drink':
                documentModel = 'Drink';
                break;
            default:
                break;
        }
        const documentInfo = await mongoose.model(documentModel).findById(document_id);

        if (!documentInfo)
            throw new AppError(404, 'NOT_FOUND', 'File not found');
        CaslError.from(req.ability)
            .setMessage('Unauthorized to view file')
            .throwUnlessCan('read', documentInfo, 'cover');

        const fileData = await s3Operations.getObject(documentInfo.cover);
        res.setHeader('Content-Type', fileData.ContentType);
        res.send(fileData.Body);
    } catch(err) {
        next(err);
    }
}
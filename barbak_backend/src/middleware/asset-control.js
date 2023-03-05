const express = require('express');
const path = require('path');
const auth = require('./auth');
const ACL = require('../models/file-access-control');
const mongoose = require('mongoose');
const fs = require('fs');

const publicDir = path.join(__dirname, '../../assets/public');
// const privateDir = path.join(__dirname, '../../assets/private');

exports.configureMiddleware = function(app) {
    app.use('/assets/public', express.static(publicDir));
    app.get('/assets/private/:file_id', auth.sessionAuthenticationRequired, async function(req, res) {
        try {
            const { file_id } = req.params;
            if (!mongoose.Types.ObjectId.isValid(file_id)) 
            return res.status(400).send({ path: 'file_id', type: 'valid', message: 'Invalid file' });
        
            const accessDocument = await ACL.findOne({ _id: file_id });
            if (!accessDocument)
                return res.status(400).send({ path: 'file_id', type: 'exist', message: 'File does not exist' });
            else if (!accessDocument.user_id.equals(req.user._id)) {
                // Set up permissions
            }
            
            const fileData = fs.readFileSync('./' + accessDocument.file_path);
            res.setHeader('Content-Type', accessDocument.mime_type);
            res.send(fileData);
        } catch(err) {
            res.status(500).send(err);
        }
    });
}
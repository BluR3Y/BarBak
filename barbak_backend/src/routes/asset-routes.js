// const express = require('express');
// const mongoose = require('mongoose');
// const fileOperations = require('../utils/file-operations');
// const { AppAccessControl } = require('../models/access-control-model');

// module.exports.connect = function(router) {
//     router.use('/assets/public', express.static('assets/public'));
//     router.use('/assets/default', express.static('static/default'));

//     router.get('/assets/private/:file_id', async (req, res) => {
//         try {
//             const { file_id } = req.params;
//             if (!mongoose.Types.ObjectId.isValid(file_id))
//                 return res.status(400).send({ path: 'file_id', type: 'valid', message: 'Invalid file id' });

//             const fileInfo = await AppAccessControl.findOne({ _id: file_id });
//             if (!fileInfo)
//                 return res.status(404).send({ path: 'file_id', type: 'exist', message: 'File does not exist' });
//             else if (!await fileInfo.authorize(req.user._id))
//                 return res.status(403).send({ path: 'file_id', type: 'valid', message: 'Unauthorized to view file' });
    
//             const fileData = await fileOperations.readSingle(fileInfo.file_path);
//             res.setHeader('Content-Type', fileInfo.mime_type);
//             res.send(fileData);
//         } catch(err) {
//             res.status(500).send(err);
//         }
//     });
// }
const assetController = require('../controllers/asset-controller');
const express = require('express');

module.exports.connect = function(router) {
    router.use('/assets/default', express.static('static/default'));
    router.get('/assets/public/:file_type/:file_name', assetController.public);
    router.get('/assets/private/:file_id', assetController.private);
}
// const express = require('express');
// const FileAccessControl = require('../models/file-access-control-model');
// const s3Operations = require('../utils/aws-s3-operations');
// const joiValidator = require('../middlewares/joi_validator');

// module.exports.connect = function(router) {
//     router.use('/assets/default', express.static('static/default'));
//     router.get('/assets/:accessControl_id', async (req, res) => {
//         try {
//             const { accessControl_id } = req.params;
//             const aclDocument = await FileAccessControl.findOne({ _id: accessControl_id });
//             if (!aclDocument)
//                 return res.status(404).send({ path: 'file_id', type: 'exist', message: 'File does not exist' });
//             else if (!aclDocument.authorize('read', { user: req.user }))
//                 return res.status(403).send({ path: 'file_id', type: 'valid', message: 'Unauthorized to view file' });
            
//             const fileData = await s3Operations.getObject(aclDocument.file_path);
//             res.setHeader('Content-Type', fileData.ContentType);
//             res.send(fileData.Body);
//         } catch(err) {
//             console.error(err);
//             res.static(500).send('Internal server error');
//         }
//     });
// }
const mediaControllers = require('../controllers/media-controller');

module.exports.connect = function(router) {
    router.get('/assets/:access_control_id', mediaControllers.assets);
    // Static File Route Here
};
const s3Operations = require('../utils/aws-s3-operations');
const { AppAccessControl } = require('../models/access-control-model');

module.exports.public = async (req, res) => {
    try {
        const { file_type, file_name } = req.params;
        const fileData = await s3Operations.getObject(`assets/public/${file_type}/${file_name}`);
        res.setHeader('Content-Type', fileData.ContentType);
        res.send(fileData.Body);
    } catch(err) {
        if (err.statusCode === 404) 
            return res.status(404).send({ path: 'file', type: 'exist', message: 'file does not exist' });
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

module.exports.private = async (req, res) => {
    try {
        const { file_id } = req.params;
        
        const fileInfo = await AppAccessControl.findOne({ _id: file_id });
        if (!fileInfo)
            return res.status(404).send({ path: 'file_id', type: 'exist', message: 'File does not exist' });
        else if (!await fileInfo.authorize(req.user?._id))
            return res.status(403).send({ path: 'file_id', type: 'valid', message: 'Unauthorized to view file' });

        const fileData = await s3Operations.getObject(fileInfo.file_path);
        res.setHeader('Content-Type', fileData.ContentType);
        res.send(fileData.Body);
    } catch(err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
}
const { ForbiddenError: CaslError, subject } = require('@casl/ability');
const s3Operations = require('../utils/aws-s3-operations');
const AppError = require('../utils/app-error');
const { AssetAccessControl } = require('../models/asset-access-control-model');

module.exports.assets = async (req, res, next) => {
    try {
        const { access_control_id } = req.params;
        const aclDocument = await AssetAccessControl.findById(access_control_id);
        if (!aclDocument)
            throw new AppError(404, 'NOT_FOUND', 'File does not exist');
        CaslError.from(req.ability)
            .setMessage('Unauthorized to view file')
            .throwUnlessCan('read', subject('assets', { document: aclDocument }));

        const fileData = await s3Operations.getObject(aclDocument.file_path);
        res.setHeader('Content-Type', fileData.ContentType);
        res.send(fileData.Body);
    } catch(err) {
        next(err);
    }
}
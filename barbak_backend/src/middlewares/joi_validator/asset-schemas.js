const Joi = require('joi');
const { mongoIdSchema } = require('./shared-schemas');
const { allowedFileFormats } = require('../../config/config.json');


const fileTypeSchema = Joi.string().max(10).custom((value, helpers) => {
    if (!allowedFileFormats.hasOwnProperty(value))
        return helpers.error('any.invalid');
    return value;
});

const fileNameSchema = Joi.string().pattern(/^\/?[a-zA-Z0-9-]{36}\.[a-z0-9]+$/).custom((value, helpers) => {
    const extension = value.split('.').pop();
    if (!allowedFileFormats.images.includes(extension) && !allowedFileFormats.videos.includes(extension)) {
      return helpers.message({ custom: 'Invalid file extension' });
    }
    return value;
});

const idValidation = Joi.object({
    file_id: mongoIdSchema.required()
});

const publicValidation = Joi.object({
    file_type: fileTypeSchema.required(),
    file_name: fileNameSchema.required()
});

module.exports = {
    get: {
        '/assets/private/:file_id': { params: idValidation },
        '/assets/public/:file_type/:file_name': { params: publicValidation }
    }
};
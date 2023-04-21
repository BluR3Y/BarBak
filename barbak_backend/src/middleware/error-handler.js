const { MulterError } = require('multer');
const AppError = require('../utils/app-error');
const { Error: MongooseError } = require('mongoose');

module.exports = (err, req, res, next) => {
    // console.log(err.errors)
    switch(true) {
        case err instanceof AppError:
            return res.status(err.statusCode).send(err.errorResponse());

        case err instanceof MongooseError.ValidationError:
            const validationErrors = {};
            for (const field in err.errors)
                validationErrors[field] = err.errors[field].message;

            const validationErrorInstance = new AppError(400, 'INVALID_ARGUMENT', 'Invalid field values', validationErrors);
            return res.status(400).send(validationErrorInstance.errorResponse());
            
        case err instanceof MulterError:
            const multerErrorInstance = new AppError(400, err.code, 'File format is not supported', err.message);
            return res.status(400).send(multerErrorInstance.errorResponse());
        
        default:
            console.error(err);
            const internalErrorInstance = new AppError(500, 'INTERNAL', 'Internal server error');
            return res.status(500).send(internalErrorInstance.errorResponse());
    }
};
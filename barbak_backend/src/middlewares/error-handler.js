const { MulterError } = require('multer');
const AppError = require('../utils/app-error');
const { Error: MongooseError } = require('mongoose');
const { ForbiddenError: CaslError } = require('@casl/ability');

module.exports = (err, req, res, next) => {
    console.log(err)
    switch(true) {
        case err instanceof AppError:
            return err.errorResponse(res);

        case err instanceof MongooseError.ValidationError:
            return (new AppError(400, 'INVALID_ARGUMENT', 'Invalid field values', Object.entries(err.errors).reduce((accumulator, [key, value]) => {
                return {
                    ...accumulator,
                    [key]: err.errors[value].message
                };
            }, {})).errorResponse(res));
            // const validationErrors = {};
            // for (const field in err.errors)
            //     validationErrors[field] = err.errors[field].message;

            // const validationErrorInstance = new AppError(400, 'INVALID_ARGUMENT', 'Invalid field values', validationErrors);
            // return res.status(400).send(validationErrorInstance.errorResponse());

        case err instanceof CaslError:
            return (new AppError(403, 'FORBIDDEN', err.message).errorResponse(res));
            
        case err instanceof MulterError:
            return (new AppError(400, err.code, 'File format is not supported', err.message).errorResponse(res));
        
        default:
            return (new AppError(500, 'INTERNAL', 'Internal server error').errorResponse(res));
    }
};
const { error_codes } = require('../config/config.json');

class AppError extends Error {
    constructor(statusCode, errorCode, message, errors) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.errors = errors;
        Error.captureStackTrace(this, this.constructor);
    }

    errorResponse() {
        const response = { 
            code: error_codes[this.errorCode],
            message: this.message,
            ...(this.errors ? { errors: this.errors } : {})
        };
        
        return response;
    }
}
module.exports = AppError;

// Discord error codes: https://discord.com/developers/docs/topics/opcodes-and-status-codes
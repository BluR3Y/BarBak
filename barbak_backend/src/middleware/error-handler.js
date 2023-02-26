const multer = require('multer');

module.exports = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // Handle Multer Error
        return res.status(400).send(err);
    }
    console.log(err)
    return res.status(500).send(err);
};
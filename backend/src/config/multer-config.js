const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const basePath = './uploads';
const { allowedFileFormats } = require('./config.json');

module.exports.imageUpload = multer({
    storage: multer.diskStorage({
        destination: function(req, file, cb) {
            const dir = path.join(basePath, 'images');
            if (!fs.existsSync(dir))
                fs.mkdirSync(dir,{ recursive: true });
            cb (null, dir);
        },
        filename: function(req, file, cb) {
            var filename;
            do {
                filename = crypto.randomUUID() + path.extname(file.originalname);
            } while(fs.existsSync(path.join(basePath, 'images', filename)));
            cb (null, filename);
        }
    }),
    fileFilter: function(req, file, cb) {
        const mime = file.mimetype.split('/');
        const type = mime[0];
        const subType = mime[1];

        if (type !== 'image' || !allowedFileFormats.images.includes(subType))
            return cb(new multer.MulterError('UNSUPPORTED_FILE_FORMAT'));
        cb (null, true);
    },
    limits: {
        fileSize: 5 * 1024 * 1024,  // 5 MB
        files: 10,    // 10 file(s) per request
    }
});

module.exports.videoUpload = multer({
    storage: multer.diskStorage({
        destination: function(req, file, cb) {
            const dir = path.join(basePath, 'video');
            if (!fs.existsSync(dir))
                fs.mkdirSync(dir,{ recursive: true });
            cb (null, dir);
        },
        filename: function(req, file, cb) {
            var filename;
            do {
                filename = crypto.randomUUID() + path.extname(file.originalname);
            } while(fs.existsSync(path.join(basePath, 'videos', filename)));
            cb (null, filename);
        }
    }),
    fileFilter: function(req, file, cb) {
        const mime = file.mimetype.split('/');
        const type = mime[0];
        const subType = mime[1];

        if (type !== 'video' || !allowedFileFormats.videos.includes(subType))
            return cb(new multer.MulterError('UNSUPPORTED_FILE_FORMAT'));
        cb (null, true);
    },
    limits: {
        fileSize: 5 * 1024 * 1024,  // 5 MB - change
        files: 1,    // 1 file(s) per request
    }
});
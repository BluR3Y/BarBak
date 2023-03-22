const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const basePath = './uploads';

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
        const supportedFormats = ['jpeg', 'png', 'gif', 'bmp', 'webp'];
        const mime = file.mimetype.split('/');
        const type = mime[0];
        const subType = mime[1];

        if (type !== 'image' || !supportedFormats.includes(subType))
            return cb(new multer.MulterError('Unsupported File Format'));
        cb (null, true);
    },
    limits: {
        fileSize: 5 * 1024 * 1024,  // 5 MB
        files: 1,    // 1 file per request
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
        const supportedFormats = ['mp4','webm','mov','avi'];
        const mime = file.mimetype.split('/');
        const type = mime[0];
        const subType = mime[1];

        if (type !== 'video' || !supportedFormats.includes(subType))
            return cb(new multer.MulterError('Unsupported File Format'));
        cb (null, true);
    },
    limits: {
        fileSize: 5 * 1024 * 1024,  // 5 MB - change
        files: 1,    // 1 file per request
    }
});
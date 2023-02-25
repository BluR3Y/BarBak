const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const supportedImages = ['jpeg','png','gif','bmp','webp'];
const supportedVideos = ['mp4','webm','mov','avi'];

const privateStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const mime = file.mimetype.split('/');
        const type = mime[0];
        const subType = mime[1];

        if (type === 'image') {
            if (!_.includes(supportedImages, subType))
                return cb(new multer.MulterError('Unsupported Image Format'));
            cb(null, 'assets/private/images/');
        } else if (type === 'video') {
            if (!_.includes(supportedVideos, subType))
                return cb(new multer.MulterError('Unsupported Video Format'));
            cb(null, 'assets/private/videos/');
        } else cb(new multer.MulterError('Unsupported File Format'));
    },
    filename: function(req, file, cb) {
        var absReadPath = path.join(__dirname, '../../assets/private/');
        const mime = file.mimetype.split('/');

        if (mime[0] === 'image')
            absReadPath = path.join(absReadPath, 'images/');
        else if (mime[0] === 'video')
            absReadPath = path.join(absReadPath, 'videos/');
        else cb(new multer.MulterError('Unsupported File Format'));

        var filename;
        do {
            filename = crypto.randomUUID() + path.extname(file.originalname);
        } while (fs.existsSync(absReadPath + filename));
        cb(null, filename);
    }
});

const publicStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const mime = file.mimetype.split('/');
        const type = mime[0];
        const subType = mime[1];

        if (type === 'image') {
            if (!_.includes(supportedImages, subType))
                return cb(new multer.MulterError('Unsupported Image Format'));
            cb(null, 'assets/public/images/');
        } else if (type === 'video') {
            if (!_.includes(supportedVideos, subType))
                return cb(new multer.MulterError('Unsupported Video Format'));
            cb(null, 'assets/public/videos/');
        } else cb(new multer.MulterError('Unsupported File Format'));
    },
    filename: function(req, file, cb) {
        var absReadPath = path.join(__dirname, '../../assets/public/');
        const mime = file.mimetype.split('/');

        if (mime[0] === 'image')
            absReadPath = path.join(absReadPath, 'images/');
        else if (mime[0] === 'video')
            absReadPath = path.join(absReadPath, 'videos/');
        else cb(new multer.MulterError('Unsupported File Format'));

        var filename;
        do {
            filename = crypto.randomUUID() + path.extname(file.originalname);
        } while (fs.existsSync(absReadPath + filename));
        cb(null, filename);
    }
});

// Used to validate the types of files beng uploaded
const setFileFilters = (req, file, cb) => {
    cb(null, true);
}

const setFileLimits = {
    fileSize: 5 * 1024 * 1024,  // 5 MB
    files: 10   // Maximum 10 files per request
}

module.exports = {
    PublicUpload: multer({ storage: publicStorage, limits: setFileLimits, fileFilter: setFileFilters }),
    PrivateUpload: multer({ storage: privateStorage, limits: setFileLimits, fileFilter: setFileFilters })
};
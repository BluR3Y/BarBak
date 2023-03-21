const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const basePath = './assets/temp/';

const setStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        const mime = file.mimetype.split('/');
        const type = mime[0];     
        
        if (type === 'image')
            cb (null, path.join(basePath, 'images'));
        else if (type === 'video')
            cb (null, path.join(basePath, 'videos'));
        else cb (new multer.MulterError('Unexpected Error'));
    },
    filename: function(req, file, cb) {
        var absReadPath = basePath;
        const mime = file.mimetype.split('/');
        const type = mime[0];

        if (type === 'image')
            absReadPath = path.join(absReadPath, 'images');
        else if (type === 'video')
            absReadPath = path.join(absReadPath, 'videos');
        else cb (new multer.MulterError('Unsupported File Format'));

        var filename;
        do {
            filename = crypto.randomUUID() + path.extname(file.originalname);
        } while (fs.existsSync(path.join(absReadPath, filename)));
        cb (null, filename);
    }
});

const setFileLimits = {
    fileSize: 5 * 1024 * 1024,  // 5 MB
    files: 10   // Maximum 10 files per request
}

// Used to validate the types of files being uploaded
const setFileFilters = (req, file, cb) => {
    const supportedImages = ['jpeg','png','gif','bmp','webp'];
    const supportedVideos = ['mp4','webm','mov','avi'];
    const mime = file.mimetype.split('/');
    const type = mime[0];
    const subType = mime[1];

    if (type === 'image' && supportedImages.includes(subType))
        cb (null, true);
    else if (type === 'video' && supportedVideos.includes(subType))
        cb (null, true);
    else cb (new multer.MulterError('Unsupported File Format'));
}

module.exports = multer({ storage: setStorage, limits: setFileLimits, fileFilter: setFileFilters });
const path = require('path');
const fs = require('fs');

module.exports.createSingle = function(uploadPath, file) {
    return new Promise((resolve, reject) => {
        const filename = Date.now() + path.extname(file.originalname);
        fs.open(uploadPath+filename, 'wx', function(err, fd) {
            if (err) reject(err);
            fs.write(fd, file.buffer, function(err, bytes) {
                if (err) reject(err);
                fs.close(fd, function(err) {
                    if(err) reject(err);
                    resolve({ filename, bytes });
                });
            });
        });
    });
}

module.exports.createMultiple = function(uploadPath, files) {
    const fileUploads = [];
    files.forEach(file => fileUploads.push(this.createSingle(uploadPath, file)));
    return Promise.all(fileUploads);
}
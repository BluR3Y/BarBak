const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

module.exports.uploadSingle = function(uploadPath, file) {
    return new Promise((resolve, reject) => {
        var filename = crypto.randomUUID() + path.extname(file.originalname);
        while(fs.existsSync(filename))
            filename = crypto.randomUUID() + path.extname(file.originalname);
        fs.open(uploadPath+filename, 'wx', function(err, fd) {
            if (err) return reject(err);
            fs.write(fd, file.buffer, function(err, bytes) {
                if (err) return reject(err);
                fs.close(fd, function(err) {
                    if(err) return reject(err);
                    resolve({ filename, bytes });
                });
            });
        });
    });
}

module.exports.uploadMultiple = function(uploadPath, files) {
    return Promise.all(files.map(async file => this.uploadSingle(uploadPath, file)));
}
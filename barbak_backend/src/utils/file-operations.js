const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// module.exports.uploadSingle = function(uploadPath, file) {
//     return new Promise((resolve, reject) => {
//         var filename;
//         do {
//             filename = crypto.randomUUID() + path.extname(file.originalname);
//         } while(fs.existsSync(filename));
//         fs.open(uploadPath + filename, 'wx', function(err, fd) {
//             if (err) return reject(err);
//             fs.write(fd, file.buffer, function(err, bytes) {
//                 if (err) return reject(err);
//                 fs.close(fd, function(err) {
//                     if(err) return reject(err);
//                     resolve({ filepath: '/' + uploadPath + filename, bytes });
//                 });
//             });
//         });
//     });
// };

// module.exports.uploadMultiple = function(uploadPath, files) {
//     return Promise.all(files.map(async file => this.uploadSingle(uploadPath, file)));
// };

module.exports.copySingle = function(readPath, writePath = path.dirname(readPath)) {
    return new Promise((resolve, reject) => {
        const absReadPath = path.join(__dirname, '../..', readPath);
        const absWritePath = path.join(__dirname, '../..', writePath ? writePath : path.dirname(readPath));

        if (!fs.existsSync(absReadPath))
            return reject('File does not exist');

        const filename = path.basename(readPath);
        var newFileName;
        do {
            newFileName = crypto.randomUUID() + path.extname(filename);
        } while(fs.existsSync(path.join(absWritePath, newFileName)));
        
        fs.copyFile(absReadPath, path.join(absWritePath, newFileName), function(err) {
            if (err) return reject(err);
            resolve(path.posix.join(writePath, newFileName));
        });
    });
};

module.exports.copyMultiple = function(readPaths, writePath) {
    return Promise.all(readPaths.map(async file => this.copySingle(file, writePath)));
}

module.exports.readSingle = function(filepath) {
    return new Promise((resolve, reject) => {
        const absPath = path.join(__dirname, '../..', filepath);
        if (!fs.existsSync(absPath))
            reject("File does not exist");
        fs.readFile(absPath, function(err , data) {
            if (err) return reject(err);
            resolve(data);
        });
    });
};

module.exports.deleteSingle = function(filepath) {
    return new Promise((resolve, reject) => {
        const absPath = path.join(__dirname, '../..', filepath);
        if (!fs.existsSync(absPath))
            reject("File does not exist");
        fs.unlink(absPath, function(err) {
            if (err) return reject(err);
            resolve();
        });
    });
};

module.exports.deleteMultiple = function(filepaths) {
    return Promise.all(filepaths.map(async file => this.deleteSingle(file)));
}
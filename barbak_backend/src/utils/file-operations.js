const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const formatPath = (filepath) => path.normalize(filepath).replace(/\\/g, '/');

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

module.exports.moveSingle = function(sourcePath, destPath) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(sourcePath))
            return reject('File does not exist');
        var filename = path.basename(sourcePath);
        while (fs.existsSync(path.join(destPath, filename)))
            filename = crypto.randomUUID() + path.extname(filename);
        const fileDest = path.join(destPath, filename);
        fs.rename(sourcePath, fileDest, (err) => {
            if (err)
                return reject(err);
            resolve(formatPath(fileDest));
        });
    });
}

module.exports.copySingle = function(readPath, writePath = path.dirname(readPath)) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(readPath))
            return reject('File does not exist');
        var filename = path.basename(readPath);
        var newFileName;
        do {
            newFileName = crypto.randomUUID() + path.extname(filename);
        } while(fs.existsSync(path.join(writePath, newFileName)));

        const fileDest = path.join(writePath, newFileName);
        console.log(fileDest)
        fs.copyFile(readPath, fileDest, (err) => {
            if (err)
                return reject(err);
            resolve(formatPath(fileDest));
        });
    });
};

module.exports.copyMultiple = function(readPaths, writePath) {
    return Promise.all(readPaths.map(async file => this.copySingle(file, writePath)));
}

module.exports.readSingle = function(filepath) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(filepath))
            reject("File does not exist");
        fs.readFile(filepath, function(err , data) {
            if (err) return reject(err);
            resolve(data);
        });
    });
};

module.exports.deleteSingle = function(filepath) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(filepath))
            reject("File does not exist");
        fs.unlink(filepath, function(err) {
            if (err) return reject(err);
            resolve();
        });
    });
};

module.exports.deleteMultiple = function(filepaths) {
    return Promise.all(filepaths.map(async file => this.deleteSingle(file)));
}
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

module.exports.uploadSingle = function(uploadPath, file) {
    return new Promise((resolve, reject) => {
        var filename;
        do {
            filename = crypto.randomUUID() + path.extname(file.originalname);
        } while(fs.existsSync(filename));
        fs.open(uploadPath + filename, 'wx', function(err, fd) {
            if (err) return reject(err);
            fs.write(fd, file.buffer, function(err, bytes) {
                if (err) return reject(err);
                fs.close(fd, function(err) {
                    if(err) return reject(err);
                    resolve({ filepath: '/' + uploadPath + filename, bytes });
                });
            });
        });
    });
};

module.exports.uploadMultiple = function(uploadPath, files) {
    return Promise.all(files.map(async file => this.uploadSingle(uploadPath, file)));
};

module.exports.copySingle = function(readPath, writePath) {
    return new Promise((resolve, reject) => {
        const absReadPath = path.join(__dirname, '../..', readPath);
        if (!fs.existsSync(absReadPath))
            return reject('File does not exist');

        const filename = path.basename(readPath);
        var newFileName;
        do {
            newFileName = crypto.randomUUID() + path.extname(filename);
        } while(fs.existsSync(newFileName));

        fs.copyFile(absReadPath, writePath + newFileName, function(err) {
            if (err) return reject(err);
            resolve( '/' + writePath + newFileName);
        });
    });
};

module.exports.copyMultiple = function(readPaths, writePath) {
    return Promise.all(readPaths.map(async file => this.copySingle(file, writePath)));
}

module.exports.readSingle = function(filepath, file) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(filepath + file))
            reject("File does not exist");
        fs.readFile(filepath + file, function(err , data) {
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
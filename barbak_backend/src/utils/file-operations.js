const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const formatPath = (filepath) => path.normalize(filepath).replace(/\\/g, '/');

module.exports.findByName = function(fileDir, fileName) {
    const files = fs.readdirSync(fileDir);
    return files.filter((file) => file.startsWith(fileName));
}

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

module.exports.stremSingle = function(filepath) {
    return fs.createReadStream(filepath);
}
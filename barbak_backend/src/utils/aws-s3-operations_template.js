const { S3 } = require('aws-sdk');
const { randomUUID } = require('crypto');
const path = require('path');
const fs = require('fs');

const config = {
    accessKey: process.env.S3_ACCESS_KEY,
    secretKey: process.env.S3_SECRET_KEY,
    bucket: process.env.S3_BUCKET,
    region: process.env.S3_REGION
};

const s3 = new S3({
    credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey
    },
    region: config.region
});

module.exports.objectMetadata = function(key) {
    const params = {
        Bucket: config.bucket,
        Key: key
    }
    return new Promise((resolve, reject) => {
        s3.headObject(params, function(err, metadata) {
            if (err)
                return reject(err);
            resolve(metadata);
        });
    });
}

module.exports.getObject = function(key) {
    const params = {
        Bucket: config.bucket,
        Key: key,
    }
    return new Promise((resolve, reject) => {
        s3.getObject(params, function(err, data) {
            if (err)
                return reject(err);
            resolve(data);
        });
    });
}

// Low-level method of uploading file
module.exports.createObject = function(file, writepath) {
    const fileStats = fs.statSync(file.path);
    const filename = randomUUID() + path.extname(file.filename);
    const fileData = fileStats.size >  5 * 1024 * 1024 ? fs.createReadStream(file.path) : fs.readFileSync(file.path);
    const params = {
        Bucket: config.bucket,
        Key: path.posix.join(writepath, filename),
        Body: fileData,
        ContentType: file.mimetype,
        ContentEncoding: 'gzip',
        StorageClass: 'STANDARD',
    };
    return new Promise((resolve, reject) => {
        s3.putObject(params, function(err, data) {
            if (err)
                return reject(err);
            resolve({
                filename,
                filepath: params.Key,
                data
            });
        });
    });
}

module.exports.copyObject = function(key, dest) {
    const filename = randomUUID() + path.extname(key);
    const params = {
        Bucket: config.bucket,
        CopySource: path.posix.join(config.bucket, key),
        Key: path.posix.join(dest || path.dirname(key), filename)
    };

    return new Promise((resolve, reject) => {
        s3.copyObject(params, function(err, data) {
            if (err)
                return reject(err);
            resolve({
                filename,
                filepath: params.Key,
                data
            });
        });
    });
}

module.exports.removeObject = function(key) {
    const params = {
        Bucket: config.bucket,
        Key: key
    };
    return new Promise((resolve, reject) => {
        s3.deleteObject(params, function(err, data) {
            if (err)
                return reject(err);
            resolve(data);
        });
    });
}
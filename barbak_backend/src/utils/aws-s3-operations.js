const { S3 } = require('aws-sdk');

const config = {
    accessKey: process.env.S3_ACCESS_KEY,
    secretKey: process.env.S3_SECRET_KEY,
    bucket: process.env.S3_BUCKET,
    region: process.env.S3_REGION
};

const s3 = new S3({
    accessKeyId: config.accessKey,
    secretAccessKey: config.secretKey,
    region: config.region
});

module.exports.exists = function(key) {
    const params = {
        Bucket: config.bucket,
        Key: key
    }
    return new Promise((resolve, reject) => {
        s3.headObject(params, function(err, metadata) {
            if (err && err.code === 'NotFound')
                resolve(false);
            else if (err)
                reject(err);
            else
                resolve(metadata);
        });
    });
}

// Low-level method of uploading file
module.exports.crateObject = function(key, body) {
    const params = {
        Bucket: config.bucket,
        Key: key,
        Body: body
    };
    return new Promise((resolve, reject) => {
        s3.putObject(params, function(err, data) {
            if (err)
                return reject(err);
            resolve(data);
        });
    });
}

// High-level method of uploading file
// module.exports.upload = function() {
//     const params = {
//         Bucket: config.bucket
//     }
//     return new Promise((resolve, reject) => {
//         s3.upload(params, function(err, ))
//     });
// }

module.exports.getObject = function(key, body) {
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
const {
    S3Client,
    GetObjectCommand,
    HeadObjectCommand,
    PutObjectCommand,
    CopyObjectCommand,
    DeleteObjectCommand
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { randomUUID } = require('crypto');
const path = require('path');
const fs = require('fs');

const config = {
    accessKey: process.env.S3_ACCESS_KEY,
    secretKey: process.env.S3_SECRET_KEY,
    bucket: process.env.S3_BUCKET,
    region: process.env.S3_REGION
};

const s3 = new S3Client({
    credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey
    },
    region: config.region
});

module.exports.getObjectMetadata = async function(key) {
    const command = new HeadObjectCommand({
        Bucket: config.bucket,
        Key: key
    });
    return (await s3.send(command));
}

module.exports.getObject = async function(key) {
    const command = new GetObjectCommand({
        Bucket: config.bucket,
        Key: key
    });
    return (await s3.send(command));
}

module.exports.createObject = async function(file, writepath) {
    const fileStats = fs.statSync(file.path);
    const filename = randomUUID();
    const fileData = fileStats.size >  5 * 1024 * 1024 ? fs.createReadStream(file.path) : fs.readFileSync(file.path);
    const command = new PutObjectCommand({
        Bucket: config.bucket,
        Key: path.posix.join(writepath, filename),
        Body: fileData,
        ContentType: file.mimetype,
        ContentEncoding: 'gzip',
        StorageClass: 'STANDARD'
    });
    return {
        ...(await s3.send(command)),
        filename,
        filepath: command.input.Key
    };
}

module.exports.copyObject = async function(key, dest) {
    const filename = randomUUID() + path.extname(key);
    const command = new CopyObjectCommand({
        Bucket: config.bucket,
        CopySource: path.posix.join(config.bucket, key),
        Key: path.posix.join(dest || path.dirname(key), filename)
    });
    return (await s3.send(command));
}

module.exports.deleteObject = async function(key) {
    const command = new DeleteObjectCommand({
        Bucket: config.bucket,
        Key: key
    });
    return (await s3.send(command));
}

module.exports.getPreSignedURL = async function(key) {
    const command = new GetObjectCommand({
        Bucket: config.bucket,
        Key: key,
        ResponseContentEncoding: 'identity'
    });
    return (await getSignedUrl(s3, command, { expiresIn: 3600 }));
}
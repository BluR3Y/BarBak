const Queue = require('bull');
const s3Operations = require('../../utils/aws-s3-operations');

const removeS3File = new Queue('remove-s3-file', `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
removeS3File.process(async (job, done) => {
    try {
        const removeInfo = await s3Operations.deleteObject(job.data.filepath);
        done(null, removeInfo);
    } catch(err) {
        done(err);
    }
});
removeS3File.on('completed', function(job, result) {
    console.log('file removed: ', result);
});
removeS3File.on('failed', (job, err) => {
    console.error(err);
});

module.exports = function(data) {
    return new Promise((resolve, reject) => {
        removeS3File.add(data, {
            attempts: 2,
            limiter: {
                max: 1000,
                duration: 5000
            }
        })
        .then((job) => {
            resolve(job);
        })
        .catch((err) => {
            reject(err);
        });
    });
}
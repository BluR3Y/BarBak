const Queue = require('bull');
const { redisClient } = require('../../config/database-config');
const s3Operations = require('../../utils/aws-s3-operations');

const removeS3File = new Queue('remove-s3-file', redisClient);
removeS3File.process(async (job, done) => {
    try {
        await s3Operations.removeObject(job.data.filepath);
        done(null);
    } catch(err) {
        done(err);
    }
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
            console.log('file removed')
            resolve(job);
        })
        .catch((err) => {
            reject(err);
        });
    });
}
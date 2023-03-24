const Queue = require('bull');
const { redisClient } = require('../../config/database-config');
const transporter = require('../../config/nodemailer-config');

const emailQueue = new Queue('email', redisClient);
const sendEmail = function(data) {
    return new Promise((resolve, reject) => {
        emailQueue.add(data, {
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

emailQueue.process(async (job, done) => {
    try {
        const mailOptions = {
            from: 'noreply@barbak.com',
            to: job.data.recipients,
            subject: job.data.subject,
            html: job.data.content
        };
        const info = await transporter.sendMail(mailOptions);
        done(null, info);
    } catch(err) {
        done(err);
    }
});

emailQueue.on('failed', (job, err) => {
    console.error(err); // Log errors
});

module.exports = sendEmail;
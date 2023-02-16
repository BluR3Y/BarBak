const transporter = require('../config/nodemailer-config');

// module.exports.tester = (recipient) => {
//     const mailOptions = {
//         from: 'noreply@barbak.com',
//         to: recipient,
//         subject: 'test',
//         text: 'Hello There this is a test'
//     };
//     return new Promise((resolve, reject) => {
//         transporter.sendMail(mailOptions, (err, info) => {
//             if (err) return reject(err);
//             resolve(info);
//         });
//     });
// }

module.exports.sendVerificationCode = ( recipient, code ) => {
    const mailOptions = {
        from: 'noreply@barbak.com',
        to: recipient,
        subject: 'Verification Code',
        text: `The verification code for your BarBak account is: ${code}`
    };
    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) return reject(err);
            resolve(info);
        });
    });
}
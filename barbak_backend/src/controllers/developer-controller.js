const Developer = require('../models/developer-model');

// module.exports.register = async (req, res) => {
//     const validation = Developer.registerValidator(req.body);

//     if(validation.error) {
//         const { path, type } = validation.error.details[0];
//         return res.status(400).send({ path: path[0], type });
//     }
//     const { name, email, host, statement } = validation.value;

//     if(await Developer.findOne({ email }))
//         return res.status(400).send({ path: 'email', type: 'exists' });
//     else if(await Developer.findOne({ host }))
//         return res.status(400).send({ path: 'host', type: 'exists' });

//     const { apiKey, hashedAPIKey } = await Developer.generateAPIKey();

//     try {
//         await Developer.create({
//             name,
//             email,
//             host,
//             statement,
//             apiKey: hashedAPIKey
//         });
//         res.status(200).send({ apiKey });
//     } catch(err) {
//         res.status(500).send(err);
//     }
// }

module.exports.register = async (req, res) => {
    console.log(req.body);
    res.send('Hello')
}
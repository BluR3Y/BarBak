const Drinkware = require('../models/drinkware-model');
const FileOperations = require('../utils/file-operations');

module.exports.create = async (req, res) => {
    const { name, description, material } = req.body;

    if(await Drinkware.findOne({ name, user: req.user })) 
        return res.status(400).send({ path: 'drinkware', type: 'exist' });

    if(!await Drinkware.validateMaterial(material))
        return res.status(400).send({ path: 'material', type: 'valid' });

    try {
        const uploadInfo = req.file ? await FileOperations.uploadSingle('assets/drinkware/', req.file) : null;

        await Drinkware.create({
            name,
            description,
            material,
            image: uploadInfo ? uploadInfo.filename : null,
            user: req.user,
            visibility: 'private'
        });
    } catch(err) {
        return res.status(500).send(err);
    }
    res.status(204).send();
}

module.exports.publicize = async (req, res) => {
    
}
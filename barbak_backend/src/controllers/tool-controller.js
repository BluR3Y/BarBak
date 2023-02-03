const FileOperations = require('../utils/file-operations');

const Tool = require('../models/tool-model');

module.exports.create = async (req, res) => {
    const { name, description, type, material } = req.body;

    if (await Tool.exists({ user: req.user, name }))
        return res.status(400).send({ path: 'tool', type: 'exist' });
        
    if (!await Tool.validateType(type))
        return res.status(400).send({ path: 'type', path: 'valid' });

    if (!await Tool.validateMaterial(material))
        return res.status(400).send({ path: 'material', path: 'valid' });

    try {
            const uploadInfo = req.file ? await FileOperations.uploadSingle('assets/tools/', req.file) : null;
            await Tool.create({
                name,
                description,
                type,
                material,
                image: uploadInfo ? uploadInfo.filename : null,
                user: req.user
            });
    } catch(err) {
        return res.status(500).send(err);
    }
    res.staus(204).send();
}
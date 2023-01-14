const Tool = require('../models/tool-model');

module.exports.create_tool = async (req, res) => {
    const validation = Tool.createToolValidator(req.body);
    
    if(validation.error) {
        const { path, type } = validation.error.details[0];
        return res.status(400).send({ path: path[0], type });
    }

    const { name, description } = validation.value;

    if(await Tool.findOne({ user: req.user, name }))
        return res.status(400).send({ path: 'tool', type: 'exists' });

    try {
        await Tool.create({
            name,
            description,
            user: req.user,
            visibility: 'private'
        });
        res.status(204).send();
    } catch(err) {
        res.status(500).send(err);
    }
}
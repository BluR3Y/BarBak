const Tool = require('../models/tool-model');
const toolValidators = require('../validators/tool-validators');

module.exports.create_user_tool = async (req, res) => {
    const validation = toolValidators.create_user_tool(req.body);
    
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
            user: req.user
        });
        res.status(204).send();
    } catch(err) {
        res.status(500).send(err);
    }
}
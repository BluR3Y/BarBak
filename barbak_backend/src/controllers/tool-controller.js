const mongoose = require('mongoose');
// const { Tool, VerifiedTool, UserTool } = require('../models/barware');
const fileOperations = require('../utils/file-operations');

module.exports.create = async (req, res) => {
    try {
        const { name, description, type } = req.body;

        if (await UserTool.exists({ user: req.user._id, name }))
            return res.status(400).send({ path: 'name', type: 'exist', message: 'A tool with that name currently exists' });
        
        const createdTool = new UserTool({
            name,
            description,
            category
        });
        await createdTool.validate();
        await createdTool.customValidate();

        res.status(204).send();
    } catch(err) {
        res.status(500).send(err);
    }
}
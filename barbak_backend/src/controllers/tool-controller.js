const mongoose = require('mongoose');
const fileOperations = require('../utils/file-operations');
const { Tool, VerifiedTool, UserTool } = require('../models/tool-model');

module.exports.createUser = async (req, res) => {
    try {
        const { name, description, category } = req.body;

        if (await UserTool.exists({ user: req.user._id, name }))
            return res.status(400).send({ path: 'name', type: 'exist', message: 'A tool with that name currently exists' });
        
        const createdTool = new UserTool({
            name,
            description,
            category,
            user: req.user._id
        });
        await createdTool.validate();
        await createdTool.customValidate();
        await createdTool.save();

        res.status(204).send();
    } catch(err) {
        if (err.name === 'ValidationError' || err.name === 'CustomValidationError')
            return res.status(400).send(err);
        res.status(500).send(err);
    }
}

module.exports.createVerified = async (req, res) => {
    try {
        const { name, description, category } = req.body;
        
        if (await VerifiedTool.exists({ name }))
            return res.status(400).send({ path: 'name', type: 'exist', message: 'A verified drinkware with that name currently exists' });

        const createdTool = new VerifiedTool({
            name,
            description,
            category
        });
        await createdTool.validate();
        await createdTool.customValidate();
        await createdTool.save();

        res.status(204).send();
    } catch(err) {
        if (err.name === 'ValidationError' || err.name === 'CustomValidationError')
            return res.status(400).send(err);
        res.status(500).send(err);
    }
}

module.exports.uploadCover = async (req, res) => {
    try {
        const { tool_id } = req.body;
        const toolCover = req.file;

        if (!toolCover)
            return res.status(400).send({ path: 'tool_image', type: 'exist', message: 'No image was uploaded' });

        const filepath = '/' + toolCover.destination + toolCover.filename;
        if (!mongoose.Types.ObjectId.isValid(tool_id)) {
            await fileOperations.deleteSingle(filepath);
            return res.status(400).send({ path: 'tool_id', type: 'valid', message: 'Invalid tool id' });
        }

        const toolInfo = await Tool.findOne({ _id: tool_id });

    } catch(err) {
        if (err.name === 'ValidationError' || err.name === 'CustomValidationError')
            return res.status(400).send(err);
        res.status(500).send(err);
    }
}
const mongoose = require('mongoose');
const fileOperations = require('../utils/file-operations');
const { Tool, VerifiedTool, UserTool } = require('../models/tool-model');
const { subject } = require('@casl/ability');

module.exports.create = async (req, res) => {
    try {
        const { name, description, category, verified } = req.body;

        if (!req.ability.can('create', subject('tools', { verified })))
            return res.status(403).send({ path: 'verified', type: 'valid', message: 'Unauthorized to create tool' });
        else if (
            (verified && await VerifiedTool.exists({ name })) ||
            (!verified && await UserTool.exists({ user: req.user._id, name }))
        )
            return res.status(400).send({ path: 'name', type: 'exist', message: 'A drinkware with that name currently exists' });

        const createdTool = verified ? new VerifiedTool({
            name,
            description,
            category
        }) : new UserTool({
            name,
            description,
            category,
            user: req.user._id
        });
        await createdTool.validate();
        await createdTool.customValidate();
        
        res.status(204).send();
    } catch(err) {
        if (err.name === 'ValidationError' || err.name === 'CustomValidationError')
            return res.status(400).send(err);
        res.status(500).send(err);
    }
}

module.exports.update = async (req, res) => {
    try {
        const { tool_id, name, description, category } = req.body;
        
    } catch(err) {
        if (err.name === 'ValidationError' || err.name === 'CustomValidationError')
            return res.status(400).send(err);
        res.status(500).send(err);
    }
}
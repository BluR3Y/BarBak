const { Tool, VerifiedTool, UserTool } = require('../models/tool-model');
const { AppAccessControl } = require('../models/access-control-model');
const { subject } = require('@casl/ability');
const fileOperations = require('../utils/file-operations');
const s3Operations = require('../utils/aws-s3-operations');

module.exports.create = async (req, res) => {
    try {
        const { name, description, category, verified } = req.body;

        if (!req.ability.can('create', subject('tools', { verified })))
            return res.status(403).send({ path: 'verified', type: 'valid', message: 'Unauthorized to create tool' });
        else if (
            (verified && await VerifiedTool.exists({ name })) ||
            (!verified && await UserTool.exists({ user: req.user._id, name }))
        )
            return res.status(400).send({ path: 'name', type: 'exist', message: 'A tool with that name currently exists' });
        
        const createdTool = (verified ? new VerifiedTool({
            name,
            description,
            category
        }) : new UserTool({
            name,
            description,
            category,
            user: req.user._id
        }) );
        await createdTool.validate();
        await createdTool.customValidate();
        await createdTool.save();

        res.status(204).send();
    } catch(err) {
        if (err.name === 'ValidationError' || err.name === 'CustomValidationError')
            return res.status(400).send(err);
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

module.exports.update = async (req, res) => {
    try {
        const { name, description, category } = req.body;
        const { tool_id } = req.params;
        const toolInfo = await Tool.findOne({ _id: tool_id });

        if (!toolInfo)
            return res.status(404).send({ path: 'tool_id', type: 'exist', message: 'Tool does not exist' });
        else if (!req.ability.can('update', subject('tools', toolInfo)))
            return res.status(403).send({ path: 'tool_id', type: 'valid', message: 'Unauthorized request' })
        else if (
            (toolInfo.model === 'User Tool' && await UserTool.exists({ user: req.user._id, name, _id: { $ne: tool_id } })) ||
            (toolInfo.model === 'Verified Tool' && await VerifiedTool.exists({ name, _id: { $ne: tool_id } }))
        )
            return res.status(400).send({ path: 'name', type: 'exist', message: 'A tool with that name currently exists' });
        
        toolInfo.name = name;
        toolInfo.description = description;
        toolInfo.category = category;

        await toolInfo.validate();
        await toolInfo.customValidate();
        res.status(204).send();
    } catch(err) {
        if (err.name === 'ValidationError' || err.name === 'CustomValidationError')
            return res.status(400).send(err);
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

module.exports.delete = async (req, res) => {
    try {
        const { tool_id } = req.params;
        const toolInfo = await Tool.findOne({ _id: tool_id });

        if (!toolInfo)
            return res.status(404).send({ path: 'tool_id', type: 'exist', message: 'Tool does not exist' });
        else if (!req.ability.can('delete', subject('tools', toolInfo)))
            return res.status(403).send({ path: 'tool_id', type: 'valid', message: 'Unauthorized request' });

        if (toolInfo.model === 'User Tool'  && toolInfo.cover_acl) {
            const aclDocument = await AppAccessControl.findOne({ _id: toolInfo.cover_acl });
            await s3Operations.removeObject(aclDocument.file_path);
            await aclDocument.remove();
        } else if (toolInfo.model === 'Verified Tool' && toolInfo.cover)
            await s3Operations.removeObject(toolInfo.cover);

        await toolInfo.remove();
        res.status(204).send();
    } catch(err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

module.exports.updatePrivacy = async (req, res) => {
    try {
        const { tool_id } = req.params;
        const toolInfo = await UserTool.findOne({ _id: tool_id });

        if (!toolInfo)
            return res.status(404).send({ path: 'tool_id', type: 'exist', message: 'Tool does not exist' });
        else if (!req.ability.can('update', subject('tools', toolInfo)))
            return res.status(403).send({ path: 'tool_id', type: 'valid', message: 'Unaunthorized request' });
        
        toolInfo.public = !toolInfo.public;
        await toolInfo.save();
        res.status(200).send(toolInfo)
    } catch(err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

module.exports.uploadCover = async (req, res) => {
    try {
        const { tool_id } = req.params;
        const toolCover = req.file;

        if (!toolCover)
            return res.status(400).send({ path: 'image', type: 'exist', message: 'No image was uploaded' });
        
        const toolInfo = await Tool.findOne({ _id: tool_id });
        if (!toolInfo)
            return res.status(404).send({ path: 'tool_id', type: 'exist', message: 'Tool does not exist' });
        else if (!req.ability.can('patch', subject('tools', toolInfo)))
            return res.status(403).send({ path: 'tool_id', type: 'valid', message: 'Unauthorized request' });

        if (toolInfo.model === 'User Tool') {
            const uploadInfo = await s3Operations.createObject(toolCover, 'assets/private/images');
            if (toolInfo.cover_acl) {
                const aclDocument = await AppAccessControl.findOne({ _id: toolInfo.cover_acl });
                await s3Operations.removeObject(aclDocument.file_path);

                aclDocument.file_name = uploadInfo.filename;
                aclDocument.file_size = toolCover.size;
                aclDocument.mime_type = toolCover.mimetype;
                aclDocument.file_path = uploadInfo.filepath;
                await aclDocument.save();
            } else {
                const createdACL = new AppAccessControl({
                    file_name: uploadInfo.filename,
                    file_size: toolCover.size,
                    mime_type: toolCover.mimetype,
                    file_path: uploadInfo.filepath,
                    user: req.user._id,
                    referenced_document: toolInfo._id,
                    referenced_model: 'Tool'
                });
                await createdACL.save();
                toolInfo.cover_acl = createdACL._id;
            }
        } else {
            const uploadInfo = await s3Operations.createObject(toolCover, 'assets/public/images');
            if (toolInfo.cover)
                await s3Operations.removeObject(toolInfo.cover);
            toolInfo.cover = uploadInfo.filepath;
        }

        await toolInfo.save();
        res.status(204).send();
    } catch(err) {
        console.error(err);
        res.status(500).send('Internal server error');
    } finally {
        if (req.file) {
            await fileOperations.deleteSingle(req.file.path)
            .catch(err => console.error(err));
        }
    }
}

module.exports.deleteCover = async (req, res) => {
    try {
        const { tool_id } = req.params;
        const toolInfo = await Tool.findOne({ _id: tool_id });

        if (!toolInfo)
            return res.status(404).send({ path: 'tool_id', type: 'exist', message: 'Tool does not exist' });
        else if (!req.ability.can('patch', subject('tools', toolInfo)))
            return res.status(403).send({ path: 'tool_id', type: 'valid', message: 'Unauthorized request' });
        else if (
            (toolInfo.model === 'Verified Tool' && !toolInfo.cover) ||
            (toolInfo.model === 'User Tool' && !toolInfo.cover_acl)
        )
            return res.status(404).send({ path: 'image', type: 'exist', message: 'Tool does not have a cover image' });

        if (toolInfo.model === 'User Tool') {
            const aclDocument = await AppAccessControl.findOne({ _id: toolInfo.cover_acl });
            await s3Operations.removeObject(aclDocument.file_path);
            await aclDocument.remove();
            toolInfo.cover_acl = null;
        } else {
            await s3Operations.removeObject(toolInfo.cover);
            toolInfo.cover = null;
        }

        await toolInfo.save();
        res.status(204).send();
    } catch(err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

module.exports.copy = async (req, res) => {
    try {
        const { tool_id } = req.params;
        const toolInfo = await Tool.findOne({ _id: tool_id });

        if (!toolInfo)
            return res.status(404).send({ path: 'tool_id', type: 'exist', message: 'Too does not exist' });
        else if (
            (!req.ability.can('read', subject('tools', toolInfo))) ||
            (!req.ability.can('create', subject('tools', { verified: false })))
        )
            return res.status(403).send({ path: 'tool_id', type: 'valid', message: 'Unauthorized request' });
        else if (await UserTool.exists({ user: req.user._id, name: toolInfo.name }))
            return res.status(400).send({ path: 'name', type: 'exist', message: 'A tool with that name currently exists' });
        
        const { name, description, category } = toolInfo;
        const createdTool = new UserTool({
            name,
            description,
            category,
            user: req.user._id
        });

        if (
            (toolInfo.model === 'Verified Tool' && toolInfo.cover_acl) ||
            (toolInfo.model === 'User Tool' && toolInfo.cover)
        ) {
            var coverPath;
            if (toolInfo.model === 'User Tool') {
                const aclDocument = await AppAccessControl.findOne({ _id: toolInfo.cover_acl });
                coverPath = aclDocument.file_path;
            } else
                coverPath = toolInfo.cover;

            const copyInfo = await s3Operations.copyObject(coverPath);
            const copyMetadata = await s3Operations.objectMetadata(copyInfo.filepath);
            const createdACL = new AppAccessControl({
                file_name: copyInfo.filename,
                file_size: copyMetadata.ContentLength,
                mime_type: copyMetadata.ContentType,
                file_path: copyInfo.filepath,
                user: req.user._id,
                referenced_document: createdTool._id,
                referenced_model: 'Tool'
            });
            await createdACL.save();
            createdTool.cover_acl = createdACL._id;
        }

        await createdTool.save();
        res.status(204).send();
    } catch(err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

module.exports.getTool = async (req, res) => {
    try {
        const { tool_id } = req.params;
        const toolInfo = await Tool.findOne({ _id: tool_id });

        if (!toolInfo)
            return res.status(404).send({ path: 'tool_id', type: 'exist', message: 'Tool does not exist' });
        else if (!req.ability.can('read', subject('tools', toolInfo)))
            return res.status(403).send({ path: 'tool_id', type: 'valid', message: 'Unauthorized request' });

        res.status(200).send(toolInfo.basicStripExcess());
    } catch(err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

module.exports.search = async (req, res) => {
    try {
        const { query, page, page_size, ordering, categories } = req.query;
        const categoryValidation = await Tool.validateCategories(categories);

        if (!categoryValidation.isValid)
            return res.status(400).send({ categories: categoryValidation.errors });

        const searchDocuments = await Tool
            .find({ name: { $regex: query } })
            .where(req.user ? 
                { 
                    $or: [
                        { model: 'Verified Tool' },
                        { user: req.user._id },
                        { public: true }
                    ] 
                } : 
                { 
                    $or: [
                        { model: 'Verified Tool' },
                        { public: true }
                    ] 
                })
            .sort(ordering)
            .skip((page - 1) * page_size)
            .limit(page_size)
            .basicInfo();


        res.status(200).send(searchDocuments);
    } catch(err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

module.exports.clientTools = async (req, res) => {
    try {
        const { page, page_size, ordering, categories } = req.query;
        const categoryValidation = await Tool.validateCategories(categories);
        
        if (!categoryValidation.isValid)
            return res.status(400).send({ categories: categoryValidation.errors });

        const userDocuments = await UserTool
            .find({ user: req.user._id })
            .sort(ordering)
            .skip((page - 1) * page_size)
            .limit(page_size)
            .extendedInfo();
        
        res.status(200).send(userDocuments);
    } catch(err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
}
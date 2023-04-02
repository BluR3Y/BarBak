const { Tool, VerifiedTool, UserTool } = require('../models/tool-model');
const { AppAccessControl } = require('../models/access-control-model');
const { subject } = require('@casl/ability');
const fileOperations = require('../utils/file-operations');
const s3Operations = require('../utils/aws-s3-operations');

module.exports.create = async (req, res) => {
    try {
        const { tool_type = 'user' } = req.params;
        const { name, description, category } = req.body;

        if (!req.ability.can('create', subject('tools', { subject_type: tool_type })))
            return res.status(403).send({ path: 'verified', type: 'valid', message: 'Unauthorized to create tool' });
        else if (tool_type === 'user' ? 
            await UserTool.exists({ user: req.user._id, name }) :
            await VerifiedTool.exists({ name })
        )
            return res.status(400).send({ path: 'name', type: 'exist', message: 'A tool with that name currently exists' });

        const createdTool = tool_type === 'user' ? new UserTool({
            name,
            description,
            category,
            user: req.user._id
        }) : new VerifiedTool({
            name,
            description,
            category
        });
        await createdTool.validate();
        await createdTool.customValidate();
        await createdTool.save();

        const responseFields = [
            { name: '_id', alias: 'id' },
            { name: 'name' },
            { name: 'description' },
            { name: 'category' },
            { name: 'cover_url', alias: 'cover' },
            {
                name: 'public',
                condition: (document) => document instanceof UserTool
            },
            {
                name: 'date_created',
                condition: (document) => document instanceof UserTool
            },
            {
                name: 'date_verified',
                condition: (document) => document instanceof VerifiedTool
            }
        ];
        res.status(201).send(createdTool.responseObject(responseFields));
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
        else if (!req.ability.can('update', subject('tools', { document: toolInfo })))
            return res.status(403).send({ path: 'tool_id', type: 'valid', message: 'Unauthorized request' });
        else if (toolInfo instanceof UserTool ?
            await UserTool.exists({ user: req.user._id, name, _id: { $ne: tool_id } }) :
            await VerifiedTool.exists({ name, _id: { $ne: tool_id } })
        )
            return res.status(400).send({ path: 'name', type: 'exist', message: 'A tool with that name currently exists' });
        
        toolInfo.name = name;
        toolInfo.description = description;
        toolInfo.category = category;
        
        await toolInfo.validate();
        await toolInfo.customValidate();
        await toolInfo.save();

        const responseFields = [
            { name: '_id', alias: 'id' },
            { name: 'name' },
            { name: 'description' },
            { name: 'category' },
            { name: 'cover_url', alias: 'cover' },
            {
                name: 'public',
                condition: (document) => document instanceof UserTool
            },
            {
                name: 'date_created',
                condition: (document) => document instanceof UserTool
            },
            {
                name: 'date_verified',
                condition: (document) => document instanceof VerifiedTool
            }
        ];
        res.status(200).send(toolInfo.responseObject(responseFields));
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
        else if (!req.ability.can('delete', subject('tools', { document: toolInfo })))
            return res.status(403).send({ path: 'tool_id', type: 'valid', message: 'Unauthorized request' });

        if (toolInfo instanceof UserTool  && toolInfo.cover_acl) {
            const aclDocument = await AppAccessControl.findOne({ _id: toolInfo.cover_acl });
            await s3Operations.removeObject(aclDocument.file_path);
            await aclDocument.remove();
        } else if (toolInfo instanceof VerifiedTool && toolInfo.cover)
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
        else if (!req.ability.can('update', subject('tools', { document: toolInfo })))
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
        else if (!req.ability.can('patch', subject('tools', { document: toolInfo })))
            return res.status(403).send({ path: 'tool_id', type: 'valid', message: 'Unauthorized request' });

        const uploadInfo = await s3Operations.createObject(toolCover, `assets/${ toolInfo instanceof UserTool ? 'private' : 'public' }/images`);
        if (toolInfo instanceof UserTool) {
            if (toolInfo.cover_acl) {
                const aclDocument = await AppAccessControl.findOne({ _id: toolInfo.cover_acl });
                await s3Operations.removeObject(aclDocument.file_path);

                aclDocument.set({
                    file_name: uploadInfo.filename,
                    file_size: toolCover.size,
                    mime_type: toolCover.mimetype,
                    file_path: uploadInfo.filepath
                });
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
        else if (!req.ability.can('patch', subject('tools', { document: toolInfo })))
            return res.status(403).send({ path: 'tool_id', type: 'valid', message: 'Unauthorized request' });
        else if (toolInfo instanceof UserTool ? !toolInfo.cover_acl : !toolInfo.cover)
            return res.status(404).send({ path: 'image', type: 'exist', message: 'Tool does not have a cover image' });

        if (toolInfo instanceof UserTool) {
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
            !req.ability.can('read', subject('tools', { action_type: 'public', document: toolInfo })) ||
            !req.ability.can('create', subject('tools', { subject_type: 'user' }))
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
        
        if (toolInfo instanceof UserTool && toolInfo.cover_acl) {
            const aclDocument = await AppAccessControl.findOne({ _id: toolInfo.cover_acl });
            const copyInfo = await s3Operations.copyObject(aclDocument.file_path);
            
            const createdACL = new AppAccessControl({
                file_name: copyInfo.filename,
                file_size: aclDocument.file_size,
                mime_type: aclDocument.mime_type,
                file_path: copyInfo.filepath,
                user: req.user._id,
                referenced_document: createdTool._id,
                referenced_model: 'Tool'
            });
            await createdACL.save();
            createdTool.cover_acl = createdACL._id;
        } else if (toolInfo instanceof VerifiedTool && toolInfo.cover) {
            const copyInfo = await s3Operations.copyObject(toolInfo.cover);
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
        const { tool_id, privacy_type = 'public' } = req.params;
        const toolInfo = await Tool.findOne({ _id: tool_id });

        if (!toolInfo)
            return res.status(404).send({ path: 'tool_id', type: 'exist', message: 'Tool does not exist' });
        else if (!req.ability.can('read', subject('tools', { action_type: privacy_type, document: toolInfo })))
            return res.status(403).send({ path: 'tool_id', type: 'valid', message: 'Unauthorized request' });

        const responseFields = [
            { name: '_id', alias: 'id' },
            { name: 'name' },
            { name: 'description' },
            { name: 'category' },
            { name: 'cover_url', alias: 'cover' },
            { name: 'verified' },
            {
                name: 'date_created',
                condition: (document) => privacy_type === 'private' && document instanceof UserTool
            },
            {
                name: 'date_verified',
                condition: (document) => privacy_type === 'private' && document instanceof VerifiedTool
            }
        ];
        res.status(200).send(toolInfo.responseObject(responseFields));
    } catch(err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

module.exports.search = async (req, res) => {
    try {
        const { query, page, page_size, ordering, category_filter } = req.query;
        const { isValid, errors } = await Tool.validateCategories(category_filter);
        
        if (!isValid)
            return res.status(400).send({ categories: errors });

        const searchQuery = Tool
            .where({ name: { $regex: query } })
            .or(req.user ? [
                { model: 'Verified Tool' },
                { user: req.user._id },
                { public: true }
            ] : [
                { model: 'Verified Tool' },
                { public: true }
            ]);

            const totalDocuments = await Tool.countDocuments(searchQuery);
            const responseDocuments = await Tool.find(searchQuery)
                .sort(ordering)
                .skip((page - 1) * page_size)
                .limit(page_size)
                .then(documents => documents.map(doc => doc.responseObject([
                    { name: '_id', alias: 'id' },
                    { name: 'name' },
                    { name: 'category' },
                    { name: 'cover_url', alias: 'cover' },
                    { name: 'verified' }
                ])));

        const response = {
            page,
            page_size,
            total_pages: Math.ceil(totalDocuments / page_size),
            total_results: totalDocuments,
            data: responseDocuments
        };
        res.status(200).send(response);
    } catch(err) {
        console.log(err);
        res.status(500).send('Internal server error');
    }
}

module.exports.clientTools = async (req, res) => {
    try {
        const { page, page_size, ordering, category_filter } = req.query;
        const { isValid, errors } = await Tool.validateCategories(category_filter);
        
        if (!isValid)
            return res.status(400).send({ categories: errors });

        const searchQuery = Tool
            .where({ user: req.user._id })
            .categoryFilter(category_filter);

        const totalDocuments = await Tool.countDocuments(searchQuery);
        const responseDocuments = await Tool
            .find(searchQuery)
            .sort(ordering)
            .skip((page - 1) * page_size)
            .limit(page_size)
            .then(documents => documents.map(doc => doc.responseObject([
                { name: '_id', alias: 'id' },
                { name: 'name' },
                { name: 'category' },
                { name: 'cover_url', alias: 'cover' },
                { name: 'public' },
                { name: 'date_created' }
            ])));

        const response = {
            page,
            page_size,
            total_pages: Math.ceil(totalDocuments / page_size),
            total_results: totalDocuments,
            data: responseDocuments
        };
        res.status(200).send(response);
    } catch(err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
}
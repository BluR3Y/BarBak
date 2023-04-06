const { Tool, VerifiedTool, UserTool } = require('../models/tool-model');
const FileAccessControl = require('../models/file-access-control-model');
const { subject } = require('@casl/ability');
const fileOperations = require('../utils/file-operations');
const s3Operations = require('../utils/aws-s3-operations');
const responseObject = require('../utils/response-object');

module.exports.create = async (req, res) => {
    try {
        const { tool_type = 'user' } = req.params;

        if (!req.ability.can('create', subject('tools', { subject_type: tool_type })))
            return res.status(403).send({ path: 'verified', type: 'valid', message: 'Unauthorized to create tool' });
        else if (tool_type === 'user' ? 
            await UserTool.exists({ user: req.user._id, name: req.body.name }) :
            await VerifiedTool.exists({ name: req.body.name })
        )
            return res.status(400).send({ path: 'name', type: 'exist', message: 'A tool with that name currently exists' });

        const createdTool = tool_type === 'user' ? 
            new UserTool({ 
                ...req.body, 
                user: req.user._id 
            }) :
            new VerifiedTool(req.body)
        ;
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
        res.status(201).send(responseObject(createdTool, responseFields));
    } catch(err) {
        if (err.name === 'ValidationError' || err.name === 'CustomValidationError')
            return res.status(400).send(err);
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

module.exports.update = async (req, res) => {
    try {
        const { tool_id } = req.params;
        const toolInfo = await Tool.findOne({ _id: tool_id });

        if (!toolInfo)
            return res.status(404).send({ path: 'tool_id', type: 'exist', message: 'Tool does not exist' });
        else if (!req.ability.can('update', subject('tools', { document: toolInfo })))
            return res.status(403).send({ path: 'tool_id', type: 'valid', message: 'Unauthorized request' });
        else if (toolInfo instanceof UserTool ?
            await UserTool.exists({ user: req.user._id, name: req.body.name, _id: { $ne: tool_id } }) :
            await VerifiedTool.exists({ name: req.body.name, _id: { $ne: tool_id } })
        )
            return res.status(400).send({ path: 'name', type: 'exist', message: 'A tool with that name currently exists' });
        
        toolInfo.set({
            ...req.body
        });
        await toolInfo.validate();
        await toolInfo.customValidate();
        await toolInfo.save();

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
        else if (!req.ability.can('delete', subject('tools', { document: toolInfo })))
            return res.status(403).send({ path: 'tool_id', type: 'valid', message: 'Unauthorized request' });

        if (toolInfo.cover) {
            const aclDocument = await FileAccessControl.findOne({ _id: toolInfo.cover });
            if (!aclDocument)
                return res.status(404).send({ path: 'cover', type: 'exist', message: 'Cover image not found' });
            else if (!aclDocument.authorize('delete', { user: req.user }))
                return res.status(404).send({ path: 'cover', type: 'valid', message: 'Unauthorized to delete cover image' });

            await s3Operations.removeObject(aclDocument.file_path);
            await aclDocument.remove();
        }
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
        if (toolInfo.cover) {
            const aclDocument = await FileAccessControl.findOne({ _id: toolInfo.cover });

            if (!aclDocument)
                return res.status(404).send({ path: 'cover', type: 'exist', message: 'Cover image not found' });
            else if (!aclDocument.authorize('update', { user: req.user }))
                return res.status(403).send({ path: 'cover', type: 'valid', message: 'Unauthorized to modify cover image' });

            aclDocument.permissions = [
                { action: 'manage', conditions: { 'user._id': req.user._id } },
                ...(toolInfo.public ?[ { action: 'read' }] : [])
            ];
            await aclDocument.save();
        }
        await toolInfo.save();
        res.status(204).send();
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

        if (toolInfo.cover) {
            const aclDocument = await FileAccessControl.findOne({ _id: toolInfo.cover });
            if (!aclDocument)
                return res.status(404).send({ path: 'cover', type: 'exist', message: 'Cover image not found' });
            else if (!aclDocument.authorize('update', { user: req.user }))
                return res.status(403).send({ path: 'cover', type: 'valid', message: 'Unauthorized to modify cover image' });

            const [,uploadInfo] = await Promise.all([
                s3Operations.removeObject(aclDocument.file_path),
                s3Operations.createObject(toolCover, 'assets/tools/images')
            ]);

            aclDocument.set({
                file_name: uploadInfo.filename,
                file_size: toolCover.size,
                mime_type: toolCover.mimetype,
                file_path: uploadInfo.filepath
            });
            await aclDocument.save();
        } else {
            const uploadInfo = await s3Operations.createObject(toolCover, 'assets/tools/images');
            const createdACL = new FileAccessControl({
                file_name: uploadInfo.filename,
                file_size: toolCover.size,
                mime_type: toolCover.mimetype,
                file_path: uploadInfo.filepath,
                permissions: (toolInfo instanceof UserTool ?
                    [
                        { action: 'manage', condition: { 'user._id': req.user._id } },
                        ...(toolInfo.public ? [{ action: 'read' }] : [])
                    ] : [
                        { action: 'read' },
                        { action: 'manage', conditions: { 'user.role': 'admin' } },
                        { action: 'manage', conditions: { 'user.role': 'editor' } }
                    ]
                )
            });

            await createdACL.save();
            toolInfo.cover = createdACL._id;
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
        else if (!toolInfo.cover)
            return res.status(404).send({ path: 'image', type: 'exist', message: 'Tool does not have a cover image' });

        const aclDocument = await FileAccessControl.findOne({ _id: toolInfo.cover });
        if (!aclDocument)
            return res.status(404).send({ path: 'cover', type: 'exist', message: 'Tool cover image not found' });
        else if (!aclDocument.authorize('delete', { user: req.user }))
            return res.status(404).send({ path: 'cover', type: 'valid', message: 'Unauthorized to delete cover image' });

        await s3Operations.removeObject(aclDocument.file_path);
        await aclDocument.remove();
        
        toolInfo.cover = null;
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

        if (toolInfo.cover) {
            const aclDocument = await FileAccessControl.findOne({ _id: toolInfo.cover });
            if (!aclDocument)
                return res.status(404).send({ path: 'cover', type: 'exist', message: 'Tool cover image not found' });
            else if (!aclDocument.authorize('read', { user: req.user }))
                return res.status(404).send({ path: 'cover', type: 'valid', message: 'Unauthorized to view cover image' });

            const copyInfo = await s3Operations.copyObject(aclDocument.file_path);
            const createdACL = FileAccessControl({
                file_name: copyInfo.filename,
                file_size: aclDocument.file_size,
                mime_type: aclDocument.mime_type,
                file_path: copyInfo.filepath,
                permissions: [
                    { action: 'manage', conditions: { 'user._id': req.user._id } }
                ]
            });
            await createdACL.save();
            createdTool.cover = createdACL._id;
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
        res.status(200).send(responseObject(toolInfo, responseFields));
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
        const responseDocuments = await Tool
            .find(searchQuery)
            .sort(ordering)
            .skip((page - 1) * page_size)
            .limit(page_size)
            .then(documents => documents.map(doc => responseObject(doc, [
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
            .then(documents => documents.map(doc => responseObject(doc, [
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
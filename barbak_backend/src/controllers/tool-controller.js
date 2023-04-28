const { Tool, VerifiedTool, UserTool } = require('../models/tool-model');
const { VerifiedAssetControl, UserAssetControl } = require('../models/asset-access-control-model');
const { ForbiddenError: CaslError, subject } = require('@casl/ability');
const fileOperations = require('../utils/file-operations');
const s3Operations = require('../utils/aws-s3-operations');
const responseObject = require('../utils/response-object');
const AppError = require('../utils/app-error');

module.exports.create = async (req, res, next) => {
    try {
        const { tool_type = 'user' } = req.params;
        CaslError.from(req.ability)
            .setMessage('Unauthorized to create tool')
            .throwUnlessCan('create', subject('tools', { subject_type: tool_type }));

        if (tool_type === 'user' ?
            await UserTool.exists({ user: req.user._id, name: req.body.name }) :
            await VerifiedTool.exists({ name: req.body.name })
        )
            throw new AppError(409, 'ALREADY_EXIST', 'A tool with that name currently exists');

        const createdTool = tool_type === 'user' ? 
            new UserTool({ 
                ...req.body, 
                user: req.user._id 
            }) :
            new VerifiedTool(req.body);
        await createdTool.save();

        const response = await responseObject(createdTool, [
            { name: '_id', alias: 'id' },
            { name: 'name' },
            { name: 'description' },
            { name: 'category_info', alias: 'category' },
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
        ]);
        res.status(201).send(response);
    } catch(err) {
        next(err);
    }
}

// module.exports.create = async (req, res, next) => {
//     try {
//         const { tool_type = 'user' } = req.params;

//         if (!req.ability.can('create', subject('tools', { subject_type: tool_type })))
//             throw new AppError(403, 'FORBIDDEN', 'Unauthorized to create tool');
//         else if (tool_type === 'user' ? 
//             await UserTool.exists({ user: req.user._id, name: req.body.name }) :
//             await VerifiedTool.exists({ name: req.body.name })
//         )
//             throw new AppError(409, 'ALREADY_EXIST', 'A tool with that name currently exists');

//         const createdTool = tool_type === 'user' ? 
//             new UserTool({ 
//                 ...req.body, 
//                 user: req.user._id 
//             }) :
//             new VerifiedTool(req.body);
//         await createdTool.validate();
//         await createdTool.save();

//         const response = await responseObject(createdTool, [
//             { name: '_id', alias: 'id' },
//             { name: 'name' },
//             { name: 'description' },
//             { name: 'category_info', alias: 'category' },
//             { name: 'cover_url', alias: 'cover' },
//             {
//                 name: 'public',
//                 condition: (document) => document instanceof UserTool
//             },
//             {
//                 name: 'date_created',
//                 condition: (document) => document instanceof UserTool
//             },
//             {
//                 name: 'date_verified',
//                 condition: (document) => document instanceof VerifiedTool
//             }
//         ]);
//         res.status(201).send(response);
//     } catch(err) {
//         next(err);
//     }
// }
// Last Here


module.exports.update = async (req, res, next) => {
    try {
        const { tool_id } = req.params;
        const toolInfo = await Tool.findOne({ _id: tool_id });

        if (!toolInfo)
            throw new AppError(404, 'NOT_FOUND', 'Tool does not exist');
        else if (!req.ability.can('update', subject('tools', { document: toolInfo })))
            throw new AppError(403, 'FORBIDDEN', 'Unauthorized to modify tool');
        else if (toolInfo instanceof UserTool ?
            await UserTool.exists({ user: req.user._id, name: req.body.name, _id: { $ne: tool_id } }) :
            await VerifiedTool.exists({ name: req.body.name, _id: { $ne: tool_id } })
        )
            throw new AppError(409, 'ALREADY_EXIST', 'A tool with that name currently exists');

        toolInfo.set(req.body);
        await toolInfo.validate();
        await toolInfo.save();

        res.status(204).send();
    } catch(err) {
        next(err);
    }
}

module.exports.delete = async (req, res, next) => {
    try {
        const { tool_id } = req.params;
        const toolInfo = await Tool.findOne({ _id: tool_id });

        if (!toolInfo)
            throw new AppError(404, 'NOT_FOUND', 'Tool does not exist');
        else if (!req.ability.can('delete', subject('tools', { document: toolInfo })))
            throw new AppError(403, 'FORBIDDEN', 'Unauthorized to modify tool');


        if (toolInfo.cover) {
            const aclDocument = await FileAccessControl.findOne({ _id: toolInfo.cover });
            if (!aclDocument.authorize('delete', { user: req.user }))
                throw new AppError(403, 'FORBIDDEN', 'Unauthorized to modify tool cover image');

            await s3Operations.removeObject(aclDocument.file_path);
            await aclDocument.remove();
        }
        await toolInfo.remove();
        res.status(204).send();
    } catch(err) {
        next(err);
    }
}

module.exports.updatePrivacy = async (req, res, next) => {
    try {
        const { tool_id } = req.params;
        const toolInfo = await Tool.findOne({ _id: tool_id });

        if (!toolInfo)
            throw new AppError(404, 'NOT_FOUND', 'Tool does not exist');
        else if (!(toolInfo instanceof UserTool))
            throw new AppError(400, 'INVALID_ARGUMENT', 'Privacy change is only allowed on non-verified tools');
        else if (!req.ability.can('patch', subject('tools', { document: toolInfo })))
            throw new AppError(403, 'FORBIDDEN', 'Unauthorized to modify tool');
        
        toolInfo.public = !toolInfo.public;
        if (toolInfo.cover) {
            const aclDocument = await FileAccessControl.findOne({ _id: toolInfo.cover });
            if (!aclDocument.authorize('update', { user: req.user }))
                throw new AppError(403, 'FORBIDDEN', 'Unauthorized to modify tool cover image');

            aclDocument.permissions = [
                { action: 'manage', conditions: { 'user._id': req.user._id } },
                ...(toolInfo.public ? { action: 'read' } : {})
            ];
            await aclDocument.save();
        }
        await toolInfo.save();
        res.status(204).send();
    } catch(err) {
        next(err);
    }
}

module.exports.uploadCover = async (req, res, next) => {
    try {
        const { tool_id } = req.params;
        const toolCover = req.file;

        if (!toolCover)
            throw new AppError(400, 'MISSING_REQUIRED_FILE', 'No image was uploaded');

        const toolInfo = await Tool.findOne({ _id: tool_id });
        if (!toolInfo)
            throw new AppError(404, 'NOT_FOUND', 'Tool does not exist');
        else if (!req.ability.can('patch', subject('tools', { document: toolInfo })))
            throw new AppError(403, 'FORBIDDEN', 'Unauthorized to modify tool');

        if (toolInfo.cover) {
            const aclDocument = await FileAccessControl.findOne({ _id: toolInfo.cover });
            if (!aclDocument.authorize('update', { user: req.user }))
                throw new AppError(403, 'FORBIDDEN', 'Unauthorized to modify tool cover image');

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
                        { action: 'manage', conditions: { 'user._id': req.user._id } },
                        ...(toolInfo.public ? { action: 'read' } : {})
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
        next(err);
    } finally {
        if (req.file) {
            fileOperations.deleteSingle(req.file.path)
            .catch(err => console.error(err));
        }
    }
}

module.exports.deleteCover = async (req, res, next) => {
    try {
        const { tool_id } = req.params;
        const toolInfo = await Tool.findOne({ _id: tool_id });

        if (!toolInfo)
            throw new AppError(404, 'NOT_FOUND', 'Tool does not exist');
        else if (!req.ability.can('patch', subject('tools', { document: toolInfo })))
            throw new AppError(403, 'FORBIDDEN', 'Unauthorized to modify tool');
        else if (!toolInfo.cover)
            throw new AppError(400, 'INVALID_ARGUMENT', 'Tool does not have a cover image');

        const aclDocument = await FileAccessControl.findOne({ _id: toolInfo.cover });
        if (!aclDocument.authorize('delete', { user: req.user }))
            throw new AppError(404, 'FORBIDDEN', 'Unauthorized to modify tool cover image');

        await s3Operations.removeObject(aclDocument.file_path);
        await aclDocument.remove();
        
        toolInfo.cover = null;
        await toolInfo.save();

        res.status(204).send();
    } catch(err) {
        next(err);
    }
}

module.exports.copy = async (req, res, next) => {
    try {
        const { tool_id } = req.params;
        const toolInfo = await Tool.findOne({ _id: tool_id });

        if (!toolInfo)
            throw new AppError(404, 'NOT_FOUND', 'Tool does not exist');
        else if (
            !req.ability.can('read', subject('tools', { action_type: 'public', document: toolInfo })) ||
            !req.ability.can('create', subject('tools', { subject_type: 'user' }))
        )
            throw new AppError(403, 'FORBIDDEN', 'Unauthorized request');
        else if (await UserTool.exists({ user: req.user._id, name: toolInfo.name }))
            throw new AppError(409, 'ALREADY_EXIST', 'Name already associated with a tool');

        const { name, description, category } = toolInfo;
        const createdTool = new UserTool({
            name,
            description,
            category,
            user: req.user._id
        });

        if (toolInfo.cover) {
            const aclDocument = await FileAccessControl.findOne({ _id: toolInfo.cover });
            if (!aclDocument.authorize('read', { user: req.user }))
                throw new AppError(403, 'FORBIDDEN', 'Unauthorized to view tool cover image');

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
        next(err);
    }
}

module.exports.getTool = async (req, res, next) => {
    try {
        const { tool_id, privacy_type = 'public' } = req.params;
        const toolInfo = await Tool.findOne({ _id: tool_id });

        if (!toolInfo)
            throw new AppError(404, 'NOT_FOUND', 'Tool does not exist');
        else if (!req.ability.can('read', subject('tools', { action_type: privacy_type, document: toolInfo })))
            throw new AppError(403, 'FORBIDDEN', 'Unauthorized to view tool');

        const response = await responseObject(toolInfo, [
            { name: '_id', alias: 'id' },
            { name: 'name' },
            { name: 'description' },
            { name: 'category_info', alias: 'category' },
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
        ]);
        res.status(200).send(response);
    } catch(err) {
        next(err);
    }
}

module.exports.search = async (req, res, next) => {
    try {
        const { query, page, page_size, ordering, categories } = req.query;
        var searchFilters;
        try {
            searchFilters = await Tool.searchFilters(categories)
        } catch(err) {
            throw new AppError(400, 'INVALID_ARGUMENT', err.message, err.errors);
        }

        const searchQuery = Tool
            .where({
                name: { $regex: query },
                $and: [
                    {
                        $or: [
                            { variant: 'Verified Tool' },
                            { variant: 'User Tool', public: true },
                            ...(req.user ? [{ variant: 'User Tool', user: req.user._id }] : [])
                        ]
                    }, ...(searchFilters.length ? [{ $and: searchFilters }] : [])
                ]
            });
        const totalDocuments = await Tool.countDocuments(searchQuery);
        const responseDocuments = await Tool
            .find(searchQuery)
            .sort(ordering)
            .skip((page - 1) * page_size)
            .limit(page_size)
            .then(documents => Promise.all(documents.map(doc => responseObject(doc, [
                { name: '_id', alias: 'id' },
                { name: 'name' },
                { name: 'category_info', alias: 'category' },
                { name: 'cover_url', alias: 'cover' },
                { name: 'verified' }
            ]))));

        const response = {
            page,
            page_size,
            total_pages: Math.ceil(totalDocuments / page_size),
            total_results: totalDocuments,
            data: responseDocuments
        };
        res.status(200).send(response);
    } catch(err) {
        next(err);
    }
}

module.exports.clientTools = async (req, res, next) => {
    try {
        const { page, page_size, ordering, categories } = req.query;
        var searchFilters;
        try {
            searchFilters = await Tool.searchFilters(categories)
        } catch(err) {
            throw new AppError(400, 'INVALID_ARGUMENT', err.message, err.errors);
        }

        const searchQuery = Tool
            .where({
                variant: 'User Tool',
                user: req.user._id,
                ...(searchFilters.length ? { $and: searchFilters } : {})
            });
        const totalDocuments = await Tool.countDocuments(searchQuery);
        const responseDocuments = await Tool
            .find(searchQuery)
            .sort(ordering)
            .skip((page - 1) * page_size)
            .limit(page_size)
            .then(documents => Promise.all(documents.map(doc => responseObject(doc, [
                { name: '_id', alias: 'id' },
                { name: 'name' },
                { name: 'category' },
                { name: 'cover_url', alias: 'cover' },
                { name: 'public' },
                { name: 'date_created' }
            ]))));

        const response = {
            page,
            page_size,
            total_pages: Math.ceil(totalDocuments / page_size),
            total_results: totalDocuments,
            data: responseDocuments
        };
        res.status(200).send(response);
    } catch(err) {
        next(err);
    }
}

module.exports.getCategories = async (req, res, next) => {
    try {
        const toolCategories = await Tool.getCategories();
        res.status(200).send(toolCategories);
    } catch(err) {
        next(err);
    }
}
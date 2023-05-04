const { Tool, VerifiedTool, UserTool } = require('../models/tool-model');
// const { VerifiedAssetControl, UserAssetControl } = require('../models/asset-access-control-model');
const { ForbiddenError: CaslError, subject } = require('@casl/ability');
const fileOperations = require('../utils/file-operations');
const s3Operations = require('../utils/aws-s3-operations');
const responseObject = require('../utils/response-object');
const AppError = require('../utils/app-error');
const { permittedFieldsOf } = require('@casl/ability/extra');

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
            { name: 'verified' },
            {
                name: 'user',
                condition: (document) => document instanceof UserTool
            },
            {
                name: 'public',
                condition: (document) => document instanceof UserTool
            },
            {
                name: 'date_created',
                ...(createdTool instanceof VerifiedTool ? { alias: 'date_verified' } : {})
            }
        ]);
        res.status(201).send(response);
    } catch(err) {
        next(err);
    }
}

module.exports.update = async (req, res, next) => {
    try {
        const { tool_id } = req.params;
        const toolInfo = await Tool.findById(tool_id);

        if (!toolInfo)
            throw new AppError(404, 'NOT_FOUND', 'Tool does not exist');
        CaslError.from(req.ability)
            .setMessage('Unauthorized to modify tool')
            .throwUnlessCan('update', subject('tools', { document: toolInfo }));

        if (toolInfo instanceof UserTool ?
            await UserTool.exists({ user: req.user._id, name: req.body.name, _id: { $ne: tool_id } }) :
            await VerifiedTool.exists({ name: req.body.name, _id: { $ne: tool_id } })
        )
            throw new AppError(409, 'ALREADY_EXIST', 'A tool with that name currently exists');

        toolInfo.set(req.body);
        await toolInfo.save();
        res.status(204).send();
    } catch(err) {
        next(err);
    }
}

module.exports.delete = async (req, res, next) => {
    try {
        const { tool_id } = req.params;
        const toolInfo = await Tool.findById(tool_id);

        if (!toolInfo)
            throw new AppError(404, 'NOT_FOUND', 'Tool does not exist');
        CaslError.from(req.ability)
            .setMessage('Unauthorized to modify tool')
            .throwUnlessCan('delete', subject('tools', { document: toolInfo }));

        if (toolInfo.cover)
            await s3Operations.deleteObject(toolInfo.cover);
        await toolInfo.delete();
        res.status(204).send();
    } catch(err) {
        next(err);
    }
}

module.exports.updatePrivacy = async (req, res, next) => {
    try {
        const { tool_id } = req.params;
        const toolInfo = await Tool.findById(tool_id);

        if (!toolInfo)
            throw new AppError(404, 'NOT_FOUND', 'Tool does not exist');
        else if (!(toolInfo instanceof UserTool))
            throw new AppError(400, 'INVALID_ARGUMENT', 'Privacy change is only allowed on non-verified tools');
        CaslError.from(req.ability)
            .setMessage('Unauthorized to modify tool')
            .throwUnlessCan('update', subject('tools', { document: toolInfo }));

        toolInfo.public = !toolInfo.public;
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
        
        const toolInfo = await Tool.findById(tool_id);
        if (!toolInfo)
            throw new AppError(404, 'NOT_FOUND', 'Tool does not exist');
        CaslError.from(req.ability)
            .setMessage('Unauthorized to modify tool')
            .throwUnlessCan('update', subject('tools', { document: toolInfo }));

        const [uploadInfo] = await Promise.all([
            s3Operations.createObject(toolCover, 'assets/tools/images'),
            ...(toolInfo.cover ? [s3Operations.deleteObject(toolInfo.cover)] : [])
        ]);
        toolInfo.cover = uploadInfo.filepath;
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
        const toolInfo = await Tool.findById(tool_id);

        if (!toolInfo)
            throw new AppError(404, 'NOT_FOUND', 'Tool does not exist');
        CaslError.from(req.ability)
            .setMessage('Unauthorized to modify tool')
            .throwUnlessCan('update', subject('tools', { document: toolInfo }));

        if (!toolInfo.cover)
            throw new AppError(404, 'NOT_FOUND', 'Tool does not have a cover image');

        await s3Operations.deleteObject(toolInfo.cover);
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
        const toolInfo = await Tool.findById(tool_id);

        if (!toolInfo)
            throw new AppError(404, 'NOT_FOUND', 'Tool does not exist');

        if (!['name', 'description', 'category'].every(field => req.ability.can('read', subject('tools', { document: toolInfo }), field)))
            throw new CaslError().setMessage('Unauthorized to view tool');

        CaslError.from(req.ability)
            .setMessage('Unauthorized to create tool')
            .throwUnlessCan('create', subject('tools', { subject_type: 'user' }));

        if (await UserTool.exists({ user: req.user._id, name: toolInfo.name }))
            throw new AppError(409, 'ALREADY_EXIST', 'Name already associated with a tool');

        const { name, description, category } = toolInfo;
        const createdTool = new UserTool({
            name,
            description,
            category,
            user: req.user._id
        });

        if (toolInfo.cover) {
            const copyInfo = await s3Operations.copyObject(toolInfo.cover);
            createdTool.cover = copyInfo.filepath;
        }
        await createdTool.save();
        res.status(204).send();
    } catch(err) {
        next(err);
    }
}

module.exports.getTool = async (req, res, next) => {
    try {
        const { tool_id, privacy_type = 'public' } = req.params
        const toolInfo = await Tool.findById(tool_id);

        if (!toolInfo)
            throw new AppError(404, 'NOT_FOUND', 'Tool does not exist');

        const responseFields = [
            { name: '_id', alias: 'id' },
            { name: 'name' },
            { name: 'description' },
            { name: 'category_info', alias: 'category' },
            { name: 'verified' },
            {
                name: 'user',
                condition: (document) => document instanceof UserTool
            },
            {
                name: 'public',
                condition: (document) => document instanceof UserTool
            },
            ...(privacy_type === 'private' ? [
                {
                    name: 'date_created',
                    ...(toolInfo instanceof VerifiedTool ? { alias: 'date_verified' } : {}),
                    condition: () => privacy_type === 'private'
                }
            ] : [])
        ];
        if (!responseFields.every(field => req.ability.can('read', subject('tools', { document: toolInfo }), field.name)))
            throw new CaslError().setMessage('Unauthorized to view tool');
        
        const response = await responseObject(toolInfo, responseFields);
        res.status(200).send(response);
    } catch(err) {
        next(err);
    }
}

module.exports.getCover = async (req, res, next) => {
    try {
        const { tool_id } = req.params;
        const toolInfo = await Tool.findById(tool_id);

        if (!toolInfo)
            throw new AppError(404, 'NOT_FOUND', 'Tool does not exist');
        CaslError.from(req.ability)
            .setMessage('Unauthorized to view tool')
            .throwUnlessCan('read', subject('tools', { document: toolInfo }), 'cover');

        if (!toolInfo.cover)
            throw new AppError(404, 'NOT_FOUND', 'Tool does not have a cover');

        const fileData = await s3Operations.getObject(toolInfo.cover);
        res.setHeader('Content-Type', fileData.ContentType);
        res.send(fileData.Body);
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
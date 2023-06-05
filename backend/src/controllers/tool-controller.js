const { Tool, VerifiedTool, UserTool } = require('../models/tool-model');
// const { VerifiedAssetControl, UserAssetControl } = require('../models/asset-access-control-model');
const { ForbiddenError: CaslError } = require('@casl/ability');
const fileOperations = require('../utils/file-operations');
const s3Operations = require('../utils/aws-s3-operations');
const responseObject = require('../utils/response-object');
const AppError = require('../utils/app-error');

module.exports.create = async (req, res, next) => {
    try {
        const createdTool = (req.params.tool_type === 'verified' ? 
            new VerifiedTool(req.body) :
            new UserTool({ ...req.body, user: req.user._id }));
        CaslError.from(req.ability)
            .setMessage('Unauthorized to create tool')
            .throwUnlessCan('create', createdTool);
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
                ...(createdTool instanceof VerifiedTool && { alias: 'date_verified' })
            }
        ]);
        res.status(201).send(response);
    } catch(err) {
        next(err);
    }
}

module.exports.modify = async (req, res, next) => {
    try {
        const { tool_id } = req.params;
        const toolInfo = await Tool.findById(tool_id);

        if (!toolInfo)
            throw new AppError(404, 'NOT_FOUND', 'Tool does not exist');
            
        const allowedFields = toolInfo.accessibleFieldsBy(req.ability, 'update');
        if (![...Object.keys(req.body), ...(req.file ? [req.file.fieldname] : [])].every(field => allowedFields.includes(field)))
            throw new CaslError().setMessage('Unauthorized to modify tool');

        toolInfo.set(req.body);
        if (req.file) {
            const uploadInfo = await s3Operations.createObject(req.file, 'assets/tools/images/cover');
            toolInfo.cover = uploadInfo.filepath;
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

module.exports.delete = async (req, res, next) => {
    try {
        const { tool_id } = req.params;
        const toolInfo = await Tool.findById(tool_id);

        if (!toolInfo)
            throw new AppError(404, 'NOT_FOUND', 'Tool does not exist');
        CaslError.from(req.ability)
            .setMessage('Unauthorized to delete tool')
            .throwUnlessCan('delete', toolInfo);

        await toolInfo.remove();
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
        
        const allowedFields = toolInfo.accessibleFieldsBy(req.ability, 'read');
        const requiredFields = ['name', 'description', 'category'];
        if (![...requiredFields, 'cover'].every(field => allowedFields.includes(field)))
            throw new CaslError().setMessage('Unauthorized to copy tool');

        const createdTool = new UserTool({
            ...(requiredFields.reduce((accumulator, current) => ({
                ...accumulator,
                [current]: toolInfo[current]
            }), {})),
            user: req.user._id
        });
        CaslError.from(req.ability)
            .setMessage('Unauthorized to create tool')
            .throwUnlessCan('create', createdTool);

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
        const { tool_id } = req.params;
        const toolInfo = await Tool.findById(tool_id);

        if (!toolInfo)
            throw new AppError(404, 'NOT_FOUND', 'Tool does not exist');
        CaslError.from(req.ability)
            .setMessage('Unauthorized to view tool')
            .throwUnlessCan('read', toolInfo);

        const response = await responseObject(toolInfo, [
            { name: '_id', alias: 'id' },
            { name: 'name' },
            { name: 'description' },
            { name: 'category_info', alias: 'category' },
            { name: 'verified' },
            { name: 'cover_url', alias: 'cover' },
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
                ...(toolInfo instanceof VerifiedTool && { alias: 'date_verified' })
            }
        ], toolInfo.accessibleFieldsBy(req.ability, 'read'));
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
                ...(categories.length && { $and: searchFilters })
            })
            .accessibleBy(req.ability);
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
                { name: 'verified' },
                {
                    name: 'user',
                    condition: (document) => document instanceof UserTool
                }
            ], doc.accessibleFieldsBy(req.ability, 'read')))));
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
                ...(categories.length && { $and: searchFilters })
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
                { name: 'public'},
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
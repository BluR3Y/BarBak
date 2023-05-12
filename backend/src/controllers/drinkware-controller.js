const { Drinkware, VerifiedDrinkware, UserDrinkware } = require('../models/drinkware-model');
const { ForbiddenError: CaslError, subject } = require('@casl/ability');
const AppError = require('../utils/app-error');
const fileOperations = require('../utils/file-operations');
const s3Operations = require('../utils/aws-s3-operations');
const responseObject = require('../utils/response-object');

module.exports.create = async (req, res, next) => {
    try {
        const createdDrinkware = req.params.drinkware_type === 'verified' ?
            new VerifiedDrinkware(req.body) :
            new UserDrinkware({ ...req.body, user: req.user._id });
        CaslError.from(req.ability)
            .setMessage('Unauthorized to create drinkware')
            .throwUnlessCan('create', createdDrinkware);
        await createdDrinkware.save();

        const response = await responseObject(createdDrinkware, [
            { name: '_id', alias: 'id' },
            { name: 'name' },
            { name: 'description' },
            {
                name: 'user',
                condition: (document) => document instanceof UserDrinkware
            },
            {
                name: 'public',
                condition: (document) => document instanceof UserDrinkware
            },
            {
                name: 'date_created',
                ...(createdDrinkware instanceof VerifiedDrinkware ? { alias: 'date_verified' } : {})
            }
        ]);
        res.status(201).send(response);
    } catch(err) {
        next(err);
    }
}

module.exports.modify = async (req, res, next) => {
    try {
        const { drinkware_id } = req.params;
        const drinkwareInfo = await Drinkware.findById(drinkware_id);

        if (!drinkwareInfo)
            throw new AppError(404, 'NOT_FOUND', 'Drinkware does not exist');

        const allowedFields = drinkwareInfo.accessibleFieldsBy(req.ability, 'update');
        if (![...Object.keys(req.body), ...(req.file ? [req.file.fieldname] : [])].every(field => allowedFields.includes(field)))
            throw new CaslError().setMessage('Unauthorized to modify drinkware');

        drinkwareInfo.set(req.body);
        if (req.file) {
            const uploadInfo = await s3Operations.createObject(req.file, 'assets/drinkware/images/cover');
            drinkwareInfo.cover = uploadInfo.filepath;
        }
        await drinkwareInfo.save();
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
        const { drinkware_id } = req.params;
        const drinkwareInfo = await Drinkware.findById(drinkware_id);

        if (!drinkwareInfo)
            throw new AppError(404, 'NOT_FOUND', 'Drinkware does not exist');
        CaslError.from(req.ability)
            .setMessage('Unauthorized to delete drinkware')
            .throwUnlessCan('delete', drinkwareInfo);

        await drinkwareInfo.remove();
        res.status(204).send();
    } catch(err) {
        next(err);
    }
}

module.exports.copy = async (req, res, next) => {
    try {
        const { drinkware_id } = req.params;
        const drinkwareInfo = await Drinkware.findById(drinkware_id);
        
        if (!drinkwareInfo)
            throw new AppError(404, 'NOT_FOUND', 'Drinkware does not exist');
        
        const allowedFields = drinkwareInfo.accessibleFieldsBy(req.ability, 'read');
        const requiredFields = ['name', 'description'];
        if (![...requiredFields, 'cover'].every(field => allowedFields.includes(field)))
            throw new CaslError().setMessage('Unauthorized to copy drinkware');
        
        const createdDrinkware = new UserDrinkware({
            ...(requiredFields.reduce((accumulator, current) => ({
                ...accumulator,
                [current]: drinkwareInfo[current]
            }), {})),
            user: req.user._id
        })
        CaslError.from(req.ability)
            .setMessage('Unauthorized to create drinkware')
            .throwUnlessCan('create', createdDrinkware);

        if (drinkwareInfo.cover) {
            const copyInfo = await s3Operations.copyObject(drinkwareInfo.cover);
            createdDrinkware.cover = copyInfo.filepath;
        }
        await createdDrinkware.save();
        res.status(204).send();
    } catch(err) {
        next(err);
    }
}

module.exports.getDrinkware = async (req, res, next) => {
    try {
        const { drinkware_id } = req.params;
        const drinkwareInfo = await Drinkware.findById(drinkware_id);

        if (!drinkwareInfo)
            throw new AppError(404, 'NOT_FOUND', 'Drinkware does not exist');
        CaslError.from(req.ability)
            .setMessage('Unauthorized to view drinkware')
            .throwUnlessCan('read', drinkwareInfo);

        const response = await responseObject(drinkwareInfo, [
            { name: '_id', alias: 'id' },
            { name: 'name' },
            { name: 'description' },
            { name: 'verified' },
            { name: 'cover_url', alias: 'cover' },
            {
                name: 'user',
                condition: (document) => document instanceof UserDrinkware
            },
            {
                name: 'public',
                condition: (document) => document instanceof UserDrinkware
            },
            {
                name: 'date_created',
                ...(drinkwareInfo instanceof VerifiedDrinkware ? { alias: 'date_verified' } : {})
            },
        ], drinkwareInfo.accessibleFieldsBy(req.ability, 'read'));
        res.status(200).send(response);
    } catch(err) {
        next(err);
    }
}

// Ordering needs debugging
module.exports.search = async (req, res, next) => {
    try {
        const { query, page, page_size, ordering } = req.query;
        const searchQuery = Drinkware
            .where({
                name: { $regex: query }
            })
            .accessibleBy(req.ability);
        const totalDocuments = await Drinkware.countDocuments(searchQuery);
        const responseDocuments = await Drinkware
            .find(searchQuery)
            .sort(ordering)
            .skip((page - 1) * page_size)
            .limit(page_size)
            .then(documents => Promise.all(documents.map(doc => responseObject(doc, [
                { name: '_id', alias: 'id' },
                { name: 'name' },
                { name: 'cover_url', alias: 'cover' },
                { name: 'verified' },
                {
                    name: 'user',
                    condition: (document) => document instanceof UserDrinkware
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

module.exports.clientDrinkware = async (req, res, next) => {
    try {
        const { page, page_size, ordering } = req.query;
        const searchQuery = Drinkware
            .where({
                variant: 'User Drinkware',
                user: req.user._id
            });
        const totalDocuments = await Drinkware.countDocuments(searchQuery);
        const responseDocuments = await Drinkware
            .find(searchQuery)
            .sort(ordering)
            .skip((page - 1) * page_size)
            .limit(page_size)
            .then(documents => Promise.all(documents.map(doc => responseObject(doc, [
                { name: '_id', alias: 'id' },
                { name: 'name' },
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
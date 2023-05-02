const { Drinkware, VerifiedDrinkware, UserDrinkware } = require('../models/drinkware-model');
const { ForbiddenError: CaslError, subject } = require('@casl/ability');
const { permittedFieldsOf } = require('@casl/ability/extra');
const AppError = require('../utils/app-error');
const fileOperations = require('../utils/file-operations');
const s3Operations = require('../utils/aws-s3-operations');
const responseObject = require('../utils/response-object');

module.exports.create = async (req, res, next) => {
    try {
        const { drinkware_type = 'user' } = req.params;

        if (!req.ability.can('create', subject('drinkware', { subject_type: drinkware_type })))
            throw new AppError(403, 'FORBIDDEN', 'Unauthorized to create drinkware');
        else if (drinkware_type === 'user' ?
            await UserDrinkware.exists({ user: req.user._id, name: req.body.name }) :
            await VerifiedDrinkware.exists({ name: req.body.name })
        )
            throw new AppError(409, 'ALREADY_EXIST', 'A drinkware with that name currently exists');

        const createdDrinkware = drinkware_type === 'user' ?
            new UserDrinkware({
                ...req.body,
                user: req.user._id
            }) :
            new VerifiedDrinkware(req.body);
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
        res.status(200).send(response);
    } catch(err) {
        next(err);
    }
}
// Joi validation should take into consideration user/public fields for user drinkware
module.exports.modify = async (req, res, next) => {
    try {
        const { drinkware_id } = req.params;
        const drinkwareInfo = await Drinkware.findById(drinkware_id);
        
        if (!drinkwareInfo)
            throw new AppError(404, 'NOT_FOUND', 'Drinkware does not exist');
        else if (!Object.keys(req.body).every(field => req.ability.can('update', subject('drinkware', { document: drinkwareInfo }), field)))
            throw new CaslError().setMessage('Unauthorized to modify drinkware');
        
        drinkwareInfo.set(req.body);
        if (req.file) {
            const uploadInfo = await s3Operations.createObject(req.file, 'assets/drinkware/cover');
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
            .throwUnlessCan('delete', subject('drinkware', { document: drinkwareInfo }));

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
        const copyFields = ['name', 'description'];

        if (!drinkwareInfo) 
            throw new AppError(404, 'NOT_FOUND', 'Drinkware does not exist');
        else if (
            !copyFields.every(field => req.ability.can('read', subject('drinkware', { document: drinkwareInfo }), field)) ||
            !req.ability.can('create', subject('drinkware', { subject_type: 'user' }))
        )
            throw new CaslError().setMessage('Unauthorized to make copy of drinkware');

        const createdDrinkware = new UserDrinkware({
            user: req.user._id,
            ...(copyFields.reduce((accumulator, current) => {
                return {
                    ...accumulator,
                    [current]: drinkwareInfo[current]
                };
            }, {}))
        });
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
            .throwUnlessCan('read', subject('drinkware', { document: drinkwareInfo }));
        
        const response = await responseObject(drinkwareInfo, [
            { name: '_id', alias: 'id' },
            { name: 'name' },
            { name: 'description' },
            { name: 'verified' },
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
        ], permittedFieldsOf(req.ability, 'read', subject('drinwkare', { document: drinkwareInfo }), { fieldsFrom: rule => rule.fields || [] }));
        res.status(200).send(response);
    } catch(err) {
        next(err);
    }
}

module.exports.getCover = async (req, res, next) => {
    try {
        const { drinkware_id } = req.params;
        const drinkwareInfo = await Drinkware.findById(drinkware_id);

        if (!drinkwareInfo)
            throw new AppError(404, 'NOT_FOUND', 'Drinkware does not exist');
        CaslError.from(req.ability)
            .setMessage('Unauthorized to view drinkware')
            .throwUnlessCan('read', subject('drinkware', { document: drinkwareInfo }), 'cover');

        if (!drinkwareInfo.cover)
            throw new AppError(404, 'NOT_FOUND', 'Drinkware does not have cover');

        const fileData = await s3Operations.getObject(drinkwareInfo.cover);
        res.setHeader('Content-Type', fileData.ContentType);
        res.send(fileData.Body);
    } catch(err) {
        next(err);
    }
}

// Needs further reviewing
module.exports.search = async (req, res, next) => {
    try {
        const { query, page, page_size, ordering } = req.query;

        const searchQuery = Drinkware
            .where({
                name: { $regex: query },
                $or: [
                    { variant: 'Verified Drinkware' },
                    { variant: 'User Drinkware', public: true },
                    ...(req.user ? [{ variant: 'User Drinkware', user: req.user._id }] : [])
                ]
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
                { name: 'verified' },
                {
                    name: 'user',
                    condition: (document) => document instanceof UserDrinkware
                }
            ]))));
            // Last Here
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
        const searchQuery = Drinkware.where({ user: req.user._id });

        const totalDocuments = await Drinkware.countDocuments(searchQuery);
        const responseDocuments = await Drinkware
            .find(searchQuery)
            .sort(ordering)
            .skip((page - 1) * page_size)
            .limit(page_size)
            .then(documents => Promise.all(documents.map(doc => responseObject(doc, [
                { name: '_id', alias: 'id' },
                { name: 'name' },
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
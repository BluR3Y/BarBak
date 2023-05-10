const { Drink, VerifiedDrink, UserDrink } = require('../models/drink-model');
const { ForbiddenError: CaslError } = require('@casl/ability');
const responseObject = require('../utils/response-object');
const fileOperations = require('../utils/file-operations');
const s3Operations = require('../utils/aws-s3-operations');
const AppError = require('../utils/app-error');

module.exports.createDrink = async (req, res, next) => {
    try {
        const createdDrink = req.params.drink_type === 'verified' ?
            new VerifiedDrink(req.body) :
            new UserDrink({ ...req.body, user: req.user._id });
        CaslError.from(req.ability)
            .setMessage('Unauthorized to create drink')
            .throwUnlessCan('create', createdDrink);
        await createdDrink.save();

        const response = await responseObject(createdDrink, [
            { name: '_id', alias: 'id' },
            { name: 'name' },
            { name: 'preparation_method' },
            { name: 'verified' }
            // Modify response
        ]);
        res.status(201).send(response);
    } catch(err) {
        next(err);
    }
}

module.exports.modifyDocument = async (req, res, next) => {
    try {
        const { drink_id } = req.params;
        const drinkInfo = await Drink.findById(drink_id);

        if (!drinkInfo)
            throw new AppError(404, 'NOT_FOUND', 'Drink does not exist');
        
        const allowedFields = drinkInfo.accessibleFieldsBy(req.ability, 'update');
        if (![...Object.keys(req.body), ...(req.file ? [req.file.fieldname] : [])].every(field => allowedFields.includes(field)))
            throw new CaslError().setMessage('Unauthorized to modify drink');

        drinkInfo.set(req.body);
        if (req.file) {
            const uploadInfo = await s3Operations.createObject(req.file, 'assets/drinks/images/cover');
            drinkInfo.cover = uploadInfo.filepath;
        }
        await drinkInfo.save();
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

module.exports.deleteDrink = async (req, res, next) => {
    try {
        const { drink_id } = req.params;
        const drinkInfo = await Drink.findById(drink_id);

        if (!drinkInfo)
            throw new AppError(404, 'NOT_FOUND', 'Drink does not exist');
        CaslError.from(req.ability)
            .setMessage('Unauthorized to delete drink')
            .throwUnlessCan('delete', drinkInfo);

        await drinkInfo.remove();
        res.status(204).send();
    } catch(err) {
        next(err);
    }
}

module.exports.galleryUpload = async (req, res, next) => {
    try {
        const { drink_id } = req.params;
        const drinkInfo = await Drink.findById(drink_id);

        if (!drinkInfo)
            throw new AppError(404, 'NOT_FOUND', 'Drink does not exist');
        else if (!drinkInfo.accessibleFieldsBy(req.ability, 'update').includes('gallery'))
            throw new CaslError().setMessage('Unauthorized to modify drink');
        else if (!req.files)
            throw new AppError(400, 'MISSING_REQUIRED_FILE', 'No image was uploaded');
        else if (req.files.length + drinkInfo.gallery.length > 10)
            throw new AppError(413, 'FILE_LIMIT_EXCEEDED', 'Each drink is only permitted 10 gallery images');

        const uploadInfo = await Promise.all(req.files.map(file => s3Operations.createObject(file, 'assets/drinks/images/gallery')));
        drinkInfo.gallery.push(...(uploadInfo.map(file => ({ file_path: file.filepath }))));
        
        await drinkInfo.save();
        res.status(201).send();
    } catch(err) {
        next(err);
    } finally {
        if (req.files) {
            Promise.all(req.files.map(file => fileOperations.deleteSingle(file.path)))
            .catch(err => console.error(err));
        }
    }
}

module.exports.galleryRemoval = async (req, res, next) => {
    try {
        const { drink_id, image_id } = req.params;
        const drinkInfo = await Drink.findById(drink_id);

        if (!drinkInfo)
            throw new AppError(404, 'NOT_FOUND', 'Drink does not exist');
        else if (!drinkInfo.accessibleFieldsBy(req.ability, 'update').includes('gallery'))
            throw new CaslError().setMessage('Unauthorized to modify drink');

        const imageIndex = drinkInfo.gallery.findIndex(storedImg => storedImg._id.equals(image_id));
        if (imageIndex === -1)
            throw new AppError(404, 'NOT_FOUND', 'Gallery image was not found');

        drinkInfo.gallery.splice(imageIndex, 1);
        await drinkInfo.save();
        res.status(204).send();
    } catch(err) {
        next(err);
    }
}

module.exports.createIngredient = async (req, res, next) => {
    try {
        const { drink_id } = req.params;
        const drinkInfo = await Drink.findById(drink_id);
        
        if (!drinkInfo)
            throw new AppError(404, 'NOT_FOUND', 'Drink does not exist');
        else if (!drinkInfo.accessibleFieldsBy(req.ability, 'update').includes('ingredients'))
            throw new CaslError().setMessage('Unauthorized to modify drink');

        drinkInfo.ingredients.push(req.body);
        await drinkInfo.save();
        res.status(201).send();
    } catch(err) {
        next(err);
    }
}

module.exports.modifyIngredient = async (req, res, next) => {
    try {
        const { drink_id, ingredient_id } = req.params;
        const drinkInfo = await Drink.findById(drink_id);
        
        if (!drinkInfo)
            throw new AppError(404, 'NOT_FOUND', 'Drink does not exist');
        else if (!drinkInfo.accessibleFieldsBy(req.ability, 'update').includes('ingredients'))
            throw new CaslError().setMessage('Unauthorized to modify drink');

        const ingredientInfo = drinkInfo.ingredients.id(ingredient_id);
        if (!ingredientInfo)
            throw new AppError(404, 'NOT_FOUND', 'Ingredient not found in drink');

        ingredientInfo.set(req.body);
        await drinkInfo.save();
        res.status(204).send();
    } catch(err) {
        next(err);
    }
}

module.exports.deleteIngredient = async (req, res, next) => {
    try {
        const { drink_id, ingredient_id } = req.params;
        const drinkInfo = await Drink.findById(drink_id);
        
        if (!drinkInfo)
            throw new AppError(404, 'NOT_FOUND', 'Drink does not exist');
        else if (!drinkInfo.accessibleFieldsBy(req.ability, 'update').includes('ingredients'))
            throw new CaslError().setMessage('Unauthorized to modify drink');

        const ingredientInfo = drinkInfo.ingredients.id(ingredient_id);
        if (!ingredientInfo)
            throw new AppError(404, 'NOT_FOUND', 'Ingredient not found in drink');

        ingredientInfo.remove();
        await drinkInfo.save();
        res.status(204).send();
    } catch(err) {
        next(err);
    }
}

module.exports.createTool = async (req, res, next) => {
    try {
        const { drink_id, tool_id } = req.params;
        const drinkInfo = await Drink.findById(drink_id);

        if (!drinkInfo)
            throw new AppError(404, 'NOT_FOUND', 'Drink does not exist');
        else if (!drinkInfo.accessibleFieldsBy(req.ability, 'update').includes('tools'))
            throw new CaslError().setMessage('Unauthorized to modify drink');

        drinkInfo.tools.push(tool_id);
        await drinkInfo.save();
        res.status(201).send();
    } catch(err) {
        next(err);
    }
}

module.exports.deleteTool = async (req, res, next) => {
    try {
        const { drink_id, tool_id } = req.params;
        const drinkInfo = await Drink.findById(drink_id);
        
        if (!drinkInfo)
            throw new AppError(404, 'NOT_FOUND', 'Drink does not exist');
        else if (!drinkInfo.accessibleFieldsBy(req.ability, 'update').includes('tools'))
            throw new CaslError().setMessage('Unauthorized to modify drink');

        const toolIndex = drinkInfo.tools.indexOf(tool_id);
        if (toolIndex === -1)
            throw new AppError(404, 'NOT_FOUND', 'Tool not found in drink');

        drinkInfo.tools.splice(toolIndex, 1);
        await drinkInfo.save();
        res.status(204).send();
    } catch(err) {
        next(err);
    }
}

module.exports.copyDrink = async (req, res, next) => {
    try {
        const { drink_id } = req.params;
        const drinkInfo = await Drink.findById(drink_id);

        if (!drinkInfo)
            throw new AppError(404, 'NOT_FOUND', 'Drink does not exist');

        const allowedFields = drinkInfo.accessibleFieldsBy(req.ability, 'read');
        const requiredFields = ['name', 'description', 'preparation_method', 'serving_style', 'drinkware', 'preparation', 'ingredients', 'tools', 'tags'];
        if (![...requiredFields, 'cover'].every(field => allowedFields.includes(field)))
            throw new CaslError().setMessage('Unauthorized to copy drink');

        const createdDrink = new UserDrink({
            ...(requiredFields.reduce((accumulator, current) => ({
                ...accumulator,
                [current]: drinkInfo[current]
            }), {})),
            user: req.user._id
        });
        CaslError.from(req.ability)
            .setMessage('Unauthorized to create drink')
            .throwUnlessCan('create', createdDrink);

        if (drinkInfo.cover) {
            const copyInfo = await s3Operations.copyObject(drinkInfo.cover);
            createdDrink.cover = copyInfo.filepath;
        }
        await createdDrink.save();
        res.status(201).send();
    } catch(err) {
        next(err);
    }
}

module.exports.getDrink = async (req, res, next) => {
    try {
        const { drink_id } = req.params;
        const drinkInfo = await Drink
            .findById(drink_id)
            .populate([
                {
                    path: 'ingredients',
                    populate: 'ingredient_info substitutes.ingredient_info'
                },
                { path: 'drinkware_info' },
                { path: 'tool_info' }
            ]);

        if (!drinkInfo)
            throw new AppError(404, 'NOT_FOUND', 'Drink does not exist');
        CaslError.from(req.ability)
            .setMessage('Unauthorized to view drink')
            .throwUnlessCan('read', drinkInfo);

        const response = await responseObject(drinkInfo, [
            { name: '_id', alias: 'id' },
            { name: 'name' },
            { name: 'description' },
            { name: 'preparation_method_info', alias: 'preparation_method' },
            { name: 'serving_style_info', alias: 'serving_style' },
            { name: 'preparation' },
            { name: 'ingredients', child_fields: [
                { name: 'ingredient_info', alias: 'ingredient', child_fields: [
                    { name: '_id', alias: 'id' },
                    { name: 'name' },
                    { name: 'description' },
                    { name: 'classification_info', parent_fields: [
                        { name: 'category' },
                        { name: 'sub_category' },
                    ] },
                    { name: 'cover_url', alias: 'cover' }
                ] },
                { name: 'measure_info', alias: 'measure' },
                { name: 'substitutes', child_fields: [
                    { name: 'ingredient_info', alias: 'ingredient', child_fields: [
                        { name: '_id', alias: 'id' },
                        { name: 'name' },
                        { name: 'description' },
                        { name: 'classification_info', parent_fields: [
                            { name: 'category' },
                            { name: 'sub_category' },
                        ] },
                        { name: 'cover_url', alias: 'cover' }
                    ] },
                    { name: 'measure_info', alias: 'measure' }
                ] },
                { name: 'optional' },
                { name: 'garnish' }
            ] },
            { name: 'drinkware_info', alias: 'drinkware', child_fields: [
                { name: '_id', alias: 'id' },
                { name: 'name' },
                { name: 'description' },
                { name: 'cover_url', alias: 'cover' },
            ] },
            { name: 'tool_info', alias: 'tools', child_fields: [
                { name: '_id', alias: 'id' },
                { name: 'name' },
                { name: 'description' },
                { name: 'category_info' },
                { name: 'cover_url', alias: 'cover' }
            ] },
            { name: 'tags' },
            { name: 'verified' },
            {
                name: 'user',
                condition: (document) => document instanceof UserDrink
            },
            {
                name: 'public',
                condition: (document) => document instanceof UserDrink
            },
            {
                name: 'date_created',
                ...(drinkInfo instanceof VerifiedDrink ? { alias: 'date_verified' } : {})
            },
            { name: 'gallery_urls', alias: 'gallery' }
        ], drinkInfo.accessibleFieldsBy(req.ability, 'read'));
        res.status(200).send(response);
    } catch(err) {
        next(err);
    }
}

module.exports.search = async (req, res, next) => {
    try {
        const { query, page, page_size, ordering, preparation_methods, serving_styles } = req.query;
        var searchFilters;
        try {
            searchFilters = await Drink.searchFilters(preparation_methods, serving_styles);
        } catch(err) {
            throw new AppError(400, 'INVALID_ARGUMENT', err.message, err.errors);
        }

        const searchQuery = Drink
            .where({
                name: { $regex: query },
                ...(searchFilters.length ? { $and: searchFilters } : {})
            })
            .accessibleBy(req.ability);
        const totalDocuments = await Drink.countDocuments(searchQuery);
        const responseDocuments = await Drink
            .find(searchQuery)
            .sort(ordering)
            .skip((page - 1) * page_size)
            .limit(page_size)
            .then(documents => Promise.all(documents.map(doc => responseObject(doc, [
                { name: '_id', alias: 'id' },
                { name: 'name' },
                { name: 'tags' },
                { name: 'verified' },
                { 
                    name: 'user',
                    condition: (document) => document instanceof UserDrink
                },
                {
                    name: 'public',
                    condition: (document) => document instanceof UserDrink
                },
                { name: 'cover_url', alias: 'cover' },
            ], doc.accessibleFieldsBy(req.ability)))));

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

module.exports.clientDrinks = async (req, res, next) => {
    try {
        const { page, page_size, ordering, preparation_methods, serving_styles } = req.query;
        var searchFilters;
        try {
            searchFilters = await Drink.searchFilters(preparation_methods, serving_styles);
        } catch(err) {
            throw new AppError(400, 'INVALID_ARGUMENT', err.message, err.errors);
        }

        const searchQuery = Drink
            .where({
                variant: 'User Drink',
                user: req.user._id,
                ...(searchFilters.length ? { $and: searchFilters } : {})
            });
        const totalDocuments = await Drink.countDocuments(searchQuery);
        const responseDocuments = await Drink
            .find(searchQuery)
            .sort(ordering)
            .skip((page - 1) * page_size)
            .limit(page_size)
            .then(documents => Promise.all(documents.map(doc => responseObject(doc, [
                { name: '_id', alias: 'id' },
                { name: 'name' },
                { name: 'tags' },
                { name: 'verified' },
                { name: 'cover_url', alias: 'cover' },
                { name: 'public' }
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

module.exports.getPreparationMethods = async (req, res, next) => {
    try {
        const drinkPreparationMethods = await Drink.getPreparationMethods();
        res.status(200).send(drinkPreparationMethods);
    } catch(err) {
        next(err);
    }
}

module.exports.getServingStyles = async (req, res, next) => {
    try {
        const drinkServingStyles = await Drink.getServingStyles();
        res.status(200).send(drinkServingStyles);
    } catch(err) {
        next(err);
    }
}
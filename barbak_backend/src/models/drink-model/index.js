const mongoose = require('mongoose');
const { executeSqlQuery } = require('../../config/database-config');
const { default_covers } = require('../../config/config.json');
const s3FileRemoval = require('../../lib/queue/remove-s3-file');

const { Drinkware, UserDrinkware } = require('./../drinkware-model');
const { Tool, UserTool } = require('./../tool-model');
const ingredientSchema = require('./ingredient-schema');
const { getPreSignedURL } = require('../../utils/aws-s3-operations');

const drinkSchema = new mongoose.Schema({
    name: {
        type: String,
        minlength: 3,
        maxlength: 30,
        lowercase: true,
        required: true
    },
    description: {
        type: String,
        maxlength: 600,
    },
    preparation_method: {
        type: Number,
        required: true
    },
    serving_style: {
        type: Number,
        required: true
    },
    drinkware: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Drinkware',
        required: true
    },
    preparation: {
        type: [{
            type: String,
            minlength: 3,
            maxlength: 100
        }],
        validate: {
            validator: function(items) {
                return items && items.length <= 25;
            },
            message: 'Number of instructions cannot be greater than 25'
        }
    },
    ingredients: {
        type: [ingredientSchema],
        required: true
    },
    tools: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tool',
            required: true
        }],
        validate: {
            validator: function(items) {
                return items && items.length <= 15;
            },
            message: 'Number of tools cannot be greater than 15'
        }
    },
    tags: {
        type: [{
            type: String,
            minlength: 3,
            maxlength: 20
        }],
        validate: {
            validator: function(items) {
                return items && items.length <= 10;
            },
            message: 'Number of tags cannot be greater than 10'
        }
    },
    cover: {
        type: String,
        default: null
    },
    gallery: {
        type: [{
            file_path: {
                type: String,
                required: true
            }
        }],
        validate: {
            validator: function(items) {
                return items && items.length <= 10;
            },
            message: 'Limited to 10 images per drink'
        },
        default: Array
    },
    date_created: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    }
},{ collection: 'drinks', discriminatorKey: 'variant' });

drinkSchema.path('name').validate(async function(name) {
    return (!await this.constructor.exists({
        name,
        _id: { $ne: this._id },
        ...(!this.verified ? { user: this.user } : {})
    }));
}, 'Name is already associated with another drink', 'ALREDY_EXIST');

drinkSchema.path('preparation_method').validate(async function(method) {
    return (await this.constructor.validatePreparationMethod(method));
}, 'Invalid preparation method', 'INVALID_ARGUMENT');

drinkSchema.path('serving_style').validate(async function(style) {
    return (await this.constructor.validateServingStyle(style));
}, 'Invalid serving style', 'INVALID_ARGUMENT');

drinkSchema.path('drinkware').validate(async function(drinkware) {
    const drinkwareInfo = await Drinkware.findOne({ _id: drinkware });
    if (!drinkwareInfo)
        return this.invalidate('drinkware', 'Drinkware does not exist', drinkware, 'exist');
    
    const { user, public } = this;
    if (this instanceof this.model('Verified Drink') && drinkwareInfo instanceof UserDrinkware)
        return this.invalidate('drinkware', 'Verified drinks must contain verified drinkware', drinkware, 'valid');
    else if (this instanceof this.model('User Drink') && drinkwareInfo instanceof UserDrinkware) {
        if (!drinkwareInfo.user.equals(user))
            return this.invalidate('drinkware', 'Drink must contain a drinkware that is verified or your', drinkware, 'valid');
        else if (public && !drinkwareInfo.public)
            return this.invalidate('drinkware', 'Drinkware must be public to include in public drinks');
    }

    return true;
});

drinkSchema.path('ingredients').validate(function(items) {
    if (items.length < 2 || items.length > 25)
        return this.invalidate('ingredients', 'Drink must contains between 2 and 25 ingredients', items, 'invalid_argument');

    const ingredientIds = new Set(items.map(({ ingredient }) => ingredient.toString()));
    if (ingredientIds.size !== items.length)
        return this.invalidate('ingredients', 'Ingredient list must not contain multiple of the same ingredient', items, 'invalid_argument');

    return true;
});

drinkSchema.path('tools').validate(async function(tools) {
    const { user, public } = this;
    await Promise.all(tools.map(async (tool, index) => {
        const toolInfo = await Tool.findOne({ _id: tool });
        if (!toolInfo)
            return this.invalidate(`tools.${index}`, 'Tool does not exist', tool, 'exist');

        if (this instanceof this.model('Verified Drink') && toolInfo instanceof UserTool)
            return this.invalidate(`tools.${index}`, 'Verified drinks must contain verified tools', tool, 'valid');
        else if (this instanceof this.model('User Drink') && toolInfo instanceof UserTool) {
            if (!toolInfo.user.equals(user))
                return this.invalidate(`tools.${index}`, 'Drink must contain tools that are verified or yours', tool, 'valid');
            else if (public && !toolInfo.public)
                return this.invalidate(`tools.${index}`, 'Tool must be public to include in public drinks');
        }
    }));
    return true;
});

drinkSchema.virtual('verified').get(function() {
    return (this instanceof this.model('Verified Drink'));
});

drinkSchema.virtual('cover_url').get(async function() {
    return (await getPreSignedURL(this.cover || default_covers.drink));
});

drinkSchema.virtual('gallery_urls').get(async function() {
    return (Promise.all(this.gallery.map(img => getPreSignedURL(img.file_path))));
});

drinkSchema.virtual('drinkware_info', {
    ref: 'Drinkware',
    localField: 'drinkware',
    foreignField: '_id',
    justOne: true
});

drinkSchema.virtual('tool_info', {
    ref: 'Tool',
    localField: 'tools',
    foreignField: '_id'
});

drinkSchema.virtual('preparation_method_info').get(async function() {
    const [{ id, name }] = await executeSqlQuery(`
        SELECT
            id,
            name
        FROM drink_preparation_methods
        WHERE id = ?
        LIMIT 1;
    `, [this.preparation_method]);
    return { id, name };
});

drinkSchema.virtual('serving_style_info').get(async function() {
    const [{ id, name }] = await executeSqlQuery(`
        SELECT
            id,
            name
        FROM drink_serving_styles
        WHERE id = ?
        LIMIT 1;
    `, [this.serving_style]);
    return { id, name };
});

drinkSchema.pre('save', async function(next) {
    const { cover, gallery } = await this.constructor.findById(this._id) || {};
    const modifiedFields = this.modifiedPaths();

    if (modifiedFields.includes('cover') && cover)
        await s3FileRemoval({ filepath: cover });
    if (modifiedFields.includes('gallery')) {
        const removedImages = gallery.filter(img => !this.gallery.find(galleryImg => galleryImg._id.equals(img._id)));
        await Promise.all(removedImages.map(file => s3FileRemoval({ filepath: file.file_path })));
    }
    next();
});

drinkSchema.pre('remove', async function(next) {
    if (this.cover)
        await s3FileRemoval({ filepath: this.cover });
    if (this.gallery.length) {
        await Promise.all(this.gallery.map(file => s3FileRemoval({ filepath: file.file_path })));
    }
    next();
});

drinkSchema.statics.getPreparationMethods = async function() {
    const preparationMethods = await executeSqlQuery(`SELECT * FROM drink_preparation_methods`);
    return (await preparationMethods.map(method => ({
        id: method.id,
        name: method.name
    })));
}

drinkSchema.statics.getServingStyles = async function() {
    const servingStyles = await executeSqlQuery(`SELECT * FROM drink_serving_styles`);
    return (await servingStyles.map(style => ({
        id: style.id,
        name: style.name
    })));
}

drinkSchema.statics.validatePreparationMethod = async function(method) {
    const [{ methodCount }] = await executeSqlQuery(`
        SELECT COUNT(*) AS methodCount
        FROM drink_preparation_methods
        WHERE id = ? LIMIT 1;
    `, [method]);
    return !!methodCount;
}

drinkSchema.statics.validateServingStyle = async function(style) {
    const [{ styleCount }] = await executeSqlQuery(`
        SELECT COUNT(*) AS styleCount
        FROM drink_serving_styles
        WHERE id = ? LIMIT 1;
    `, [style]);
    return !!styleCount;
}

drinkSchema.statics.searchFilters = async function(preparation_methods, serving_styles) {
    const [preparationMethodValidations,servingStyleValidations] = await Promise.all([
        Promise.all(preparation_methods.map(method => Drink.validatePreparationMethod(method))),
        Promise.all(serving_styles.map(style => Drink.validateServingStyle(style)))
    ]);
    const invalidParameters = {
        ...(preparationMethodValidations.some(method => !method) ? {
            preparation_methods: preparation_methods.reduce((accumulator, current, index) => ([
                ...accumulator,
                ...(!preparationMethodValidations[index] ? [{
                    preparation_method: current,
                    message: 'Invalid preparation method'    
                }] : []) 
            ]), [])
        } : {}),
        ...(servingStyleValidations.some(style => !style) ? {
            serving_styles: serving_styles.reduce((accumulator, current, index) => ([
                ...accumulator,
                ...(!servingStyleValidations[index] ? [{
                    serving_style: current,
                    message: 'Invalid serving style'
                }] : [])
            ]), [])
        } : {})
    };
    if (Object.keys(invalidParameters).length) {
        const error = new Error('Invalid filter parameters');
        error.errors = invalidParameters;
        throw error;
    }
    return [
        ...(preparation_methods.length ? [{ preparation_method: { $in: preparation_methods } }] : []),
        ...(serving_styles.length ? [{ serving_style: { $in: serving_styles } }] : [])
    ];
}

drinkSchema.statics.__resourceType = function() {
    return 'drinks';
}

const Drink = mongoose.model('Drink', drinkSchema);

const verifiedSchema = new mongoose.Schema();

const userSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        immutable: true,
        required: true,
    },
    public: {
        type: Boolean,
        default: false
    }
});

module.exports = {
    Drink,
    VerifiedDrink: Drink.discriminator('Verified Drink', verifiedSchema),
    UserDrink: Drink.discriminator('User Drink', userSchema)
};
const mongoose = require('mongoose');
const {executeSqlQuery} = require('../config/database-config');
const FileOperations = require('../utils/file-operations');

const Drinkware = mongoose.model("Drinkware", new mongoose.Schema({
    name: {
        type: String,
        minLength: [3, 'Name must be at least 3 characters long'],
        maxLength: [30, 'Name length must not exceed 30 characters'],
        lowercase: true,
        required: [true, 'Drinkware name is required']
    },
    description: {
        type: String,
        maxLength: [600, 'Description must not exceed 600 characters'],
    },
    material: {
        type: String,
        required: [true, 'Tool material is required'],
    },
    image: {
        type: String,
        default: null
    },
},{ collection: 'drinkware', discriminatorKey: 'model' }));

Drinkware.schema.statics = {
    getMaterials: async function() {
        const materials = await executeSqlQuery(`SELECT name FROM drinkware_materials`);
        return (await materials.map(item => item.name));
    }
}

const publicDrinkwareSchema = new mongoose.Schema({
    date_published: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    }
});

const privateDrinkwareSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        immutable: true,
        required: true
    },
    date_created: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    }
});

privateDrinkwareSchema.query.userExposure = function() {
    return this.select('name description material image date_created -model');
}

privateDrinkwareSchema.methods.customValidate = async function() {
    const error = new Error();
    error.name = "CustomValidationError";
    error.errors = {};

    const { materialCount } = await executeSqlQuery(`SELECT COUNT(*) AS materialCount FROM drinkware_materials WHERE name = '${this.material}' LIMIT 1;`)
        .then(res => res[0]);
    if (!materialCount)
        error.errors['material'] = { type: 'valid', message: 'Invalid material' };

    if (Object.keys(error.errors).length)
        throw error;
}

privateDrinkwareSchema.statics.makePublic = async function(snapshot) {
    const { name, description, material, image } = snapshot;
    const copiedImage = image ? await FileOperations.copySingle(image, 'assets/public/images/') : null;
    const createdDocument = this.model('Public Drinkware')({
        name,
        description,
        material,
        image: copiedImage
    });
    await createdDocument.save();
}

module.exports = {
    PublicDrinkware: Drinkware.discriminator("Public Drinkware", publicDrinkwareSchema),
    PrivateDrinkware: Drinkware.discriminator("Private Drinkware", privateDrinkwareSchema),
    BaseDrinkware: Drinkware
};
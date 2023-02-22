const mongoose = require('mongoose');
const {executeSqlQuery} = require('../config/database-config');

const Drinkware = mongoose.model("Drinkware", new mongoose.Schema({
    name: {
        type: String,
        minLength: 3,
        maxLength: 30,
        lowercase: true,
        required: true
    },
    description: {
        type: String,
        maxLength: 600,
    },
    material: {
        type: String,
        required: true,
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

privateDrinkwareSchema.methods.customValidate = async function() {
    const error = new Error();
    error.name = "CustomValidationError";
    error.errors = {};

    const { materialCount } = await executeSqlQuery(`SELECT COUNT(*) AS materialCount FROM drinkware_materials WHERE name = '${this.material}'`)
        .then(res => res[0]);
    if (!materialCount)
        error.errors['material'] = { type: 'valid', message: 'Invalid material' };

    if (Object.keys(error.errors).length)
        throw error;
}

module.exports = {
    PublicDrinkware: Drinkware.discriminator("Public Drinkware", publicDrinkwareSchema),
    PrivateDrinkware: Drinkware.discriminator("Private Drinkware", privateDrinkwareSchema)
};
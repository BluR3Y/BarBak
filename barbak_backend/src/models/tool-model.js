const mongoose = require('mongoose');
const { executeSqlQuery } = require('../config/database-config');
const FileOperations = require('../utils/file-operations');

const Tool = mongoose.model("Tool", new mongoose.Schema({
    name: {
        type: String,
        minLength: [3, 'Name must be at least 3 characters long'],
        maxLength: [30, 'Name length must not exceed 30 characters'],
        required: [true , 'Tool name is required'],
    },
    description: {
        type: String,
        maxLength: [600, 'Description must not exceed 600 characters'],
    },
    type: {
        type: String,
        required: [true, 'Tool type is required']
    },
    material: {
        type: String,
        required: [true, 'Tool material is required']
    },
    image: {
        type: String,
        default: null,
    } 
}, { collection: 'tools', discriminatorKey: 'model' }));

Tool.schema.statics = {
    getTypes: async function() {
        const types = await executeSqlQuery(`SELECT name FROM tool_types`);
        return (await types.map(item => item.name))
    },
    getMaterials: async function() {
        const materials = await executeSqlQuery(`SELECT name FROM tool_materials`);
        return (await materials.map(item => item.name));
    },
    validateType: async function(type) {
        const { typeCount } = await executeSqlQuery(`SELECT count(*) AS typeCount FROM tool_types WHERE name = '${type}' LIMIT 1;`)
            .then(res => res[0]);
        return Boolean(typeCount);
    },
    validateMaterial: async function(material) {
        const { materialCount } = await executeSqlQuery(`SELECT count(*) AS materialCount FROM tool_materials WHERE name = '${material}' LIMIT 1;`)
            .then(res => res[0]);
        return Boolean(materialCount);
    }
}

const publicToolSchema = new mongoose.Schema({
    date_published: {
        type: Date,
        required: true,
        immutable: true,
        default: () => Date.now()
    }
});

const privateToolSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        immutable: true
    },
    date_created: {
        type: Date,
        immutable: true,
        default: () => Date.now(),
    }
});

privateToolSchema.query.userExposure = function() {
    return this.select('name description type material image date_created -model');
}

privateToolSchema.methods.customValidate = async function() {
    const {type, material} = this;
    const error = new Error();
    error.name = "CustomValidationError";
    error.errors = {};

    const { typeCount } = await executeSqlQuery(`SELECT count(*) AS typeCount FROM tool_types WHERE name = '${type}' LIMIT 1;`)
        .then(res => res[0]);
    if (!typeCount)
        error.errors['type'] = { type: 'valid', message: 'Invalid Tool Type' };
    
    const { materialCount } = await executeSqlQuery(`SELECT count(*) AS materialCount FROM tool_materials WHERE name = '${material}' LIMIT 1;`)
        .then(res => res[0]);
    if (!materialCount)
        error.errors['material'] = { type: 'valid', message: 'Invalid Tool Material' }

    if (Object.keys(error.errors).length)
        throw error;
}

privateToolSchema.statics.makePublic = async function(snapshot) {
    const { name, description, type, material, image } = snapshot;
    const copiedImage = image ? await FileOperations.copySingle(image, 'assets/public/images/') : null;
    const createdDocument = this.model('Public Tool')({
        name,
        description,
        type,
        material,
        image: copiedImage
    });
    await createdDocument.save();
}

module.exports = {
    PublicTool: Tool.discriminator('Public Tool', publicToolSchema),
    PrivateTool: Tool.discriminator('Private Tool', privateToolSchema),
    BaseTool: Tool
};
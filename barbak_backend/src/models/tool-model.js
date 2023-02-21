const mongoose = require('mongoose');
const { executeSqlQuery } = require('../config/database-config');

const Tool = mongoose.model("Tool", new mongoose.Schema({
    name: {
        type: String,
        minLength: 3,
        maxLength: 30,
        required: true,
    },
    description: {
        type: String,
        maxLength: 500,
    },
    type: {
        type: String,
        required: true
    },
    material: {
        type: String,
    },
    image: {
        type: String,
    } 
}, { collection: 'tools', discriminatorKey: 'model' }));

Tool.schema.query.publicInfo = function() {
    return this.select('name description type material image -model');
}

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
        const {type_id} = await executeSqlQuery(`SELECT type_id FROM tool_types WHERE name = '${type}';`)
            .then(res => res.length ? res[0] : res);
        return (type_id !== undefined);
    },
    validateMaterial: async function(material) {
        const {material_id} = await executeSqlQuery(`SELECT material_id FROM tool_materials WHERE name = '${material}';`)
            .then(res => res.length ? res[0] : res);
        return (material_id !== undefined);
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
        required: true,
        immutable: true,
        default: () => Date.now(),
    }
});
// Function "validate" should validate data types
// Function "customValidate" should validate data values, coencides with model structure
privateToolSchema.methods.customValidate = async function() {
    const error = new Error();
    error.name = "CustomValidationError";
    error.errors = [];

    if (this.type !== "other") {
        const {type_id} = await executeSqlQuery(`SELECT type_id FROM tool_types WHERE name = '${this.type}';`)
            .then(res => res.length ? res[0] : res);
        if (!type_id)
            error.errors[`type`] = "valid";
    }
    if (this.material !== "other") {
        const {material_id} = await executeSqlQuery(`SELECT material_id FROM tool_materials WHERE name = '${this.material}';`)
            .then(res => res.length? res[0] : res);
        if (!material_id)
            error.errors[`material`] = "valid";
    }
    if (Object.keys(error.errors).length)
        throw error;
};

module.exports = {
    PublicTool: Tool.discriminator('Public Tool', publicToolSchema),
    PrivateTool: Tool.discriminator('Private Tool', privateToolSchema)
};
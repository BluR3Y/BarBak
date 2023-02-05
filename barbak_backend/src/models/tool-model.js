const mongoose = require('mongoose');
const {executeSqlQuery} = require('../config/database-config');

const toolSchema = new mongoose.Schema({
    name: {
        type: String,
        minLength: 3,
        maxLength: 30,
        required: true
    },
    description: {
        type: String,
        maxLength: 500
    },
    type: {
        type: String,
        required: true
    },
    material: {
        type: String,
    },
    image: {
        type: String
    },
    user: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "User",
        required: true,
        immutable: true,
    },
    visibility: {
        type: String,
        required: true,
        lowercase: true,
        default: 'private',
        enum: {
            values: ['private', 'public', 'in-review'],
            message: props => `${props.value} is not a valid 'visibility' state`,
        }
    },
    creation_date: {
        type: Date,
        required: true,
        immutable: true,
        default: () => Date.now(),
    }
}, { collection: 'tools' });

toolSchema.statics.getTypes = async function() {
    const types = await executeSqlQuery(`SELECT name FROM tool_types`);
    return (await types.map(item => item.name))
}

toolSchema.statics.getMaterials = async function() {
    const materials = await executeSqlQuery(`SELECT name FROM tool_materials`);
    return (await materials.map(item => item.name));
}

toolSchema.statics.validateType = async function(type) {
    const {type_id} = await executeSqlQuery(`SELECT type_id FROM tool_types WHERE name = '${type}';`)
        .then(res => res.length ? res[0] : res);
    console.log(type_id)
    return (type_id !== undefined);
}

toolSchema.statics.validateMaterial = async function(material) {
    const {material_id} = await executeSqlQuery(`SELECT material_id FROM tool_materials WHERE name = '${material}';`)
        .then(res => res.length ? res[0] : res);
    return (material_id !== undefined);
}

toolSchema.methods.customValidate = async function() {
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
}

module.exports = mongoose.model("Tool", toolSchema);